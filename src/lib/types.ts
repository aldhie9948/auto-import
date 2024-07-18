export interface IPlanDetail {
  plan_no: string;
  id_barang: string;
  plan_time: string;
  plan_qty: number;
  mesin: string;
  mulai: string | null;
  selesai: string | null;
  keterangan: string;
  id?: number;
  [key: string]: any;
}

export interface IPlan {
  id?: number;
  plan_no: string;
  tanggal: string;
  pic: string;
  dept: string;
  bagian: string;
  shift: string;
  tanggal_selesai: string | null;
}

export interface IArea {
  id_area: string;
  kode_area: string;
  nama_area: string;
  plant: string;
}
