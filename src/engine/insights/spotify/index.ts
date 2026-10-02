import clock from './clock';
import discovery from './discovery';
import minutes from './minutes';
import onRepeat from './onRepeat';
import opener from './opener';
import podcasts from './podcasts';
import skips from './skips';
import streak from './streak';
import summary from './summary';
import topArtist from './topArtist';
import topArtists from './topArtists';
import topTracks from './topTracks';

export const spotifyInsights = [
  opener,
  minutes,
  topArtist,
  topArtists,
  topTracks,
  onRepeat,
  clock,
  skips,
  discovery,
  streak,
  podcasts,
  summary,
];
