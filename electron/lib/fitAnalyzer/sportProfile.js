// Sport profile resolution. Maps the FIT `sport` + `sub_sport` pair to a
// behavior profile that controls which derived metrics make sense.
//
// Profile flags:
//   gap          — apply Minetti grade-adjusted pace
//   drift        — surface HR drift across lap halves
//   decoupling   — surface Pa:HR decoupling / efficiency factor
//   pace_primary — pace is a meaningful primary metric (false for skiing)

const PROFILES = {
  running:       { gap: true,  drift: true,  decoupling: true,  pace_primary: true  },
  hiking:        { gap: false, drift: true,  decoupling: false, pace_primary: true  },
  cycling:       { gap: false, drift: true,  decoupling: true,  pace_primary: true  },
  ski_touring:   { gap: false, drift: false, decoupling: false, pace_primary: false },
  alpine_skiing: { gap: false, drift: false, decoupling: false, pace_primary: false },
  default:       { gap: true,  drift: true,  decoupling: true,  pace_primary: true  }
};

export function resolveProfile(sport, subSport) {
  const s = (sport ?? '').toLowerCase();
  const sub = (subSport ?? '').toLowerCase();

  // Backcountry / ski mountaineering: Garmin records this either as
  //   sport=cross_country_skiing, sub_sport=backcountry
  // or sport=alpine_skiing, sub_sport=backcountry. Treat both as ski_touring.
  if (sub === 'backcountry') return 'ski_touring';
  if (s === 'cross_country_skiing') return 'ski_touring';
  if (s === 'alpine_skiing') return 'alpine_skiing';

  if (s === 'running' || s === 'trail_running') return 'running';
  if (s === 'hiking' || s === 'walking') return 'hiking';
  if (s === 'cycling' || s.includes('biking') || s === 'gravel_cycling') return 'cycling';

  return 'default';
}

export function profileFlags(profileName) {
  return PROFILES[profileName] ?? PROFILES.default;
}
