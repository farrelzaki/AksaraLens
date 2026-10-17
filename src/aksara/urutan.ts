// Urutan tampak <-> urutan logis Unicode. Taling (ꦺ) disimpan Unicode SESUDAH hurufnya,
// tetapi tertulis di KIRI huruf; CRNN membaca kiri->kanan sehingga keluarannya urutan tampak.
// Salinan persis to_visual/to_logical dari notebook Model 2 (sel 11).

const NGLEGENA = 'ꦲꦤꦕꦫꦏꦢꦠꦱꦮꦭꦥꦝꦗꦪꦚꦩꦒꦧꦛꦔ';
const TALING = 'ꦺ';
const PANGKON = '꧀';
const MEDIAL = 'ꦽꦾꦿ'; // keret, pengkal, cakra (tidak dibaca model, dipertahankan agar sama dengan notebook)

const C = `[${NGLEGENA}]`;
const KLUSTER = `(?:${C})(?:${PANGKON}${C})*[${MEDIAL}]*`;

const reVisual = new RegExp(`(${KLUSTER})${TALING}`, 'g');
const reLogis = new RegExp(`${TALING}(${KLUSTER})`, 'g');

/** Urutan logis -> tampak (taling dipindah ke depan klusternya). */
export const keVisual = (s: string): string => s.replace(reVisual, `${TALING}$1`);

/** Keluaran model (urutan tampak) -> Unicode logis yang benar. */
export const keLogis = (s: string): string => s.replace(reLogis, `$1${TALING}`);
