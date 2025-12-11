export type IPlanDetail = {
  plan_no: string;
  id_barang: string;
  plan_time: number | string;
  plan_qty: number;
  mesin: string;
  mulai: string | null;
  selesai: string | null;
  keterangan: string;
  id?: number;
  [key: string]: any;
};

export type IPlan = {
  id?: number;
  plan_no: string;
  tanggal: string;
  pic: string;
  dept: string;
  bagian: string;
  shift: string;
  tanggal_selesai: string | null;
};

export type IArea = {
  id_area: string;
  kode_area: string;
  nama_area: string;
  plant: string;
};
