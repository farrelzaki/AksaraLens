# Plan B2 (docs/RENCANA_SCANNER_FINAL.md): fine-tune pembaca pra-latih PP-OCRv5_server_rec dengan charset AksaraLens.
# Berkas ini satu-satunya sumber config PaddleOCR; dipakai uji asap CPU di laptop dan ditempel ke notebook Colab B2.
# Kelas keluaran = blank + 31 karakter scanner_charset.json dengan urutan yang sama, jadi indeks keluaran ONNX identik dengan
# pembaca v2 (ctc.ts, dekoder bahasa L5, dan penilai status tidak perlu diubah). Label dalam urutan TAMPAK (taling di depan).
# Tidak ada spasi (use_space_char False) dan tidak ada label kosong: PaddleOCR membuang sampel berlabel kosong, jadi
# penolakan "bukan aksara" tetap tugas klasifikator + penilai status.
import json, os

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TINGGI = 48                 # tinggi masukan PP-OCRv5 rec
PANJANG_MAKS = 100          # karakter (urutan tampak) per baris; label lebih panjang dibuang PaddleOCR


def charset():
    """31 karakter tanpa blank, urutan = indeks kelas 1..31 di scanner_charset.json."""
    meta = json.load(open(os.path.join(AKAR, 'src/ml/model2/scanner_charset.json'), encoding='utf-8'))
    assert meta['blank'] == 0
    return meta['charset'][1:]


def tulis_dict(path):
    open(path, 'w', encoding='utf-8').write('\n'.join(charset()) + '\n')


def buat_config(data_dir, latih, val, dict_path, out_dir, pretrained, epoch=20, bs=32, lr=2e-4, lebar_maks=1600,
                gpu=True, workers=4, eval_tiap=500, cetak_tiap=50):
    """Config YAML (dict) untuk tools/train.py. latih/val: daftar 'path\\tlabel\\tw\\th' relatif terhadap data_dir.
    Latih memakai MultiScaleDataSet ds_width: batch dikelompokkan per rasio lebar/tinggi, lebar = 48 x rasio (maks lebar_maks),
    sehingga baris buku panjang tidak dipadatkan ke 320 px seperti config bawaan."""
    keys = ['image', 'label_ctc', 'label_gtc', 'length', 'valid_ratio']
    return {
        'Global': dict(model_name='PP-OCRv5_server_rec', debug=False, use_gpu=gpu, epoch_num=epoch, log_smooth_window=20,
                       print_batch_step=cetak_tiap, save_model_dir=out_dir, save_epoch_step=max(1, epoch), eval_batch_step=[0, eval_tiap],
                       cal_metric_during_train=True, calc_epoch_interval=1, pretrained_model=pretrained, checkpoints=None,
                       save_inference_dir=None, use_visualdl=False, infer_img=None, character_dict_path=dict_path,
                       max_text_length=PANJANG_MAKS, infer_mode=False, use_space_char=False, distributed=False,
                       save_res_path=os.path.join(out_dir, 'prediksi.txt'), d2s_train_image_shape=[3, TINGGI, 320]),
        'Optimizer': dict(name='Adam', beta1=0.9, beta2=0.999,
                          lr=dict(name='Cosine', learning_rate=lr, warmup_epoch=1),
                          regularizer=dict(name='L2', factor=3.0e-05)),
        'Architecture': dict(model_type='rec', algorithm='SVTR_HGNet', Transform=None,
                             Backbone=dict(name='PPHGNetV2_B4', text_rec=True),
                             Head=dict(name='MultiHead', head_list=[
                                 {'CTCHead': dict(Neck=dict(name='svtr', dims=120, depth=2, hidden_dims=120, kernel_size=[1, 3], use_guide=True),
                                                  Head=dict(fc_decay=0.00001))},
                                 {'NRTRHead': dict(nrtr_dim=384, max_text_length=PANJANG_MAKS)}])),
        'Loss': dict(name='MultiLoss', loss_config_list=[{'CTCLoss': None}, {'NRTRLoss': None}]),
        'PostProcess': dict(name='CTCLabelDecode'),
        'Metric': dict(name='RecMetric', main_indicator='acc'),
        'Train': dict(
            dataset=dict(name='MultiScaleDataSet', ds_width=True, data_dir=data_dir, ext_op_transform_idx=1, label_file_list=[latih],
                         transforms=[{'DecodeImage': dict(img_mode='BGR', channel_first=False)}, {'RecAug': None},
                                     {'MultiLabelEncode': dict(gtc_encode='NRTRLabelEncode')}, {'KeepKeys': dict(keep_keys=keys)}]),
            sampler=dict(name='MultiScaleSampler', scales=[[320, TINGGI]], first_bs=bs, fix_bs=True, divided_factor=[8, 16],
                         is_training=True, max_w=float(lebar_maks)),
            loader=dict(shuffle=True, batch_size_per_card=bs, drop_last=True, num_workers=workers)),
        'Eval': dict(
            dataset=dict(name='SimpleDataSet', data_dir=data_dir, label_file_list=[val],
                         transforms=[{'DecodeImage': dict(img_mode='BGR', channel_first=False)},
                                     {'MultiLabelEncode': dict(gtc_encode='NRTRLabelEncode')},
                                     {'RecResizeImg': dict(image_shape=[3, TINGGI, lebar_maks])}, {'KeepKeys': dict(keep_keys=keys)}]),
            loader=dict(shuffle=False, drop_last=False, batch_size_per_card=max(1, bs // 2), num_workers=workers)),
    }


def tulis_config(path, **kw):
    import yaml
    yaml.safe_dump(buat_config(**kw), open(path, 'w', encoding='utf-8'), allow_unicode=True, sort_keys=False)


# ---------- Masukan ONNX hasil ekspor (dipakai bangku uji Python; aplikasi web menyalin aturan yang sama) ----------
def ke_masukan(gray_atau_bgr, lebar_maks=3200):
    """Potongan baris -> [1, 3, 48, W] float32 seperti resize_norm_img PaddleOCR: tinggi 48, lebar proporsional (kelipatan 8),
    (x/255 - 0.5)/0.5. Polaritas TIDAK dibalik di sini; pemanggil boleh mencoba dua polaritas."""
    import cv2, numpy as np
    a = gray_atau_bgr
    if a.ndim == 2:
        a = cv2.cvtColor(a, cv2.COLOR_GRAY2BGR)
    h, w = a.shape[:2]
    W = int(min(lebar_maks, max(8, round(TINGGI * w / max(h, 1) / 8) * 8)))
    x = cv2.resize(a, (W, TINGGI), interpolation=cv2.INTER_LINEAR).astype(np.float32)
    x = (x.transpose(2, 0, 1) / 255.0 - 0.5) / 0.5
    return x[None].astype(np.float32)
