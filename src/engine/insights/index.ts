import { lifeInsights } from './life';
import { netflixInsights } from './netflix';
import { registerInsights } from './registry';
import { spotifyInsights } from './spotify';
import { youtubeInsights } from './youtube';

registerInsights([...spotifyInsights, ...youtubeInsights, ...netflixInsights, ...lifeInsights]);
