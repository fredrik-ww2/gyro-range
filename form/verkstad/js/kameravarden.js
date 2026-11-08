/* Värden till den befintliga kartkameran (flyg/kamera/kamera_apple_zoom_v1.js).
   Zoom, lutningstak och avstånd sköts av den modulen. Det här är bara dess inställningar
   för en 2×2 km höjdterräng. */

export const KAMERAVARDEN = {
  fov_vertikal_grader: 48,
  gester: {
    mus_dampning_pa: true,
    mus_dampning: 0.09,
    hjul_zoom_hastighet: 1,
    kartgester_pa: true
  },
  lutning: {
    min_grader: 6,
    max_grader: 78,
    tak_efter_avstand: [[25, 78], [120, 62], [400, 48], [1200, 32], [4000, 18]],
    klamning_tid_s: 0.45
  },
  avstand: {
    d_min_m: 18,
    d_max_m: 'auto',
    d_max_auto_marginal: 1.2,
    d_max_fast_m: 6000
  },
  granser: {
    panorering_begransad_pa: true,
    marginal_m: 120
  },
  mark: {
    mal_foljer_mark_pa: true,
    mal_foljer_mark_tid_s: 0.18,
    min_hojd_over_mark_m: 1.6
  },
  klipp: {
    near_andel_av_hojd: 0.03,
    near_min_m: 0.35,
    near_max_m: 12,
    far_min_m: 3500,
    far_faktor: 4
  },
  start: {
    mal_xz_m: [-420, 280],
    d_m: 380,
    lutning_grader: 42,
    kurs_grader: 30
  }
};
