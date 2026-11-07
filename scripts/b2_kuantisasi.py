# Kuantisasi int8 statis (QDQ) pembaca B2: 75 MB -> 18 MB, ~17x lebih cepat di CPU, akurasi Nusa/Set C tidak turun.
# paddle2onnx menyimpan bobot sebagai node Constant, yang tidak disentuh quantizer; maka bobot dipindah ke initializer dulu.
# Kalibrasi: 120 baris NusaAksara dari halaman LATIH (pembagian halaman sama dengan uji_nusa.py), bukan Set C.
# Pakai:  python -X utf8 scripts/b2_kuantisasi.py <b2_fp32.onnx> <keluaran_int8.onnx>
import os, re, sys, glob, random, tempfile
import numpy as np, cv2, onnx, onnxruntime as ort
from onnxruntime.quantization import quantize_static, QuantType, QuantFormat, CalibrationDataReader
from onnxruntime.quantization.shape_inference import quant_pre_process
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b2_paddle as b2
ort.set_default_logger_severity(3)
AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def konstanta_ke_initializer(src, dst):
    m = onnx.load(src)
    sisa = []
    for n in m.graph.node:
        a = n.attribute[0] if n.op_type == 'Constant' and len(n.attribute) == 1 else None
        if a is not None and a.name == 'value' and len(a.t.dims) >= 1 and int(np.prod(a.t.dims)) > 1:
            a.t.name = n.output[0]
            m.graph.initializer.append(a.t)
        else:
            sisa.append(n)
    del m.graph.node[:]
    m.graph.node.extend(sisa)
    onnx.save(m, dst)


def baris_kalibrasi(n=120):
    fs = sorted(glob.glob(os.path.join(AKAR, 'docs/random/nusa/baris/*.png')))
    hal = sorted({int(re.search(r'_(\d+)_\d+\.', f).group(1)) for f in fs})
    random.Random(0).shuffle(hal)
    latih = set(hal[:int(len(hal) * .75)])
    fs = [f for f in fs if int(re.search(r'_(\d+)_\d+\.', f).group(1)) in latih]
    random.Random(1).shuffle(fs)
    return fs[:n]


class _Baca(CalibrationDataReader):
    def __init__(self, fs, nama):
        self.it, self.nama = iter(fs), nama

    def get_next(self):
        for f in self.it:
            g = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
            if g is not None:
                return {self.nama: b2.ke_masukan(g)}
        return None


def main(src, dst):
    with tempfile.TemporaryDirectory() as d:
        ini, pre = os.path.join(d, 'ini.onnx'), os.path.join(d, 'pre.onnx')
        konstanta_ke_initializer(src, ini)
        quant_pre_process(ini, pre, skip_symbolic_shape=True)
        nama = ort.InferenceSession(pre, providers=['CPUExecutionProvider']).get_inputs()[0].name
        quantize_static(pre, dst, _Baca(baris_kalibrasi(), nama), quant_format=QuantFormat.QDQ, per_channel=True,
                        weight_type=QuantType.QInt8, activation_type=QuantType.QUInt8, op_types_to_quantize=['Conv', 'MatMul', 'Gemm'])
    print(dst, os.path.getsize(dst) >> 20, 'MB')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
