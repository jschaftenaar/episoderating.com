export function findMinMax(seasons) {
  let max = 0;
  let min = 0;
  seasons.forEach((season, index) => {
    season.episodes.forEach((episode) => {
      if (episode.vote_average) {
        if (!max || episode.vote_average>max) {
          max = episode.vote_average;
        }
        if (!min || episode.vote_average<min) {
          min = episode.vote_average;
        }
      }
    });
  });
  return {
    min,
    max
  };
};

export function maxEpisodes(seasons){
  let highest = 0;
  seasons.forEach((season)=> {
    if (season.episode_count>highest)
      highest = season.episode_count;
    }
  );
  return highest;
};

export function ratingClass(rating) {
  if (rating>9) {
    return 'rating-excellent';
  }
  if (rating>8) {
    return 'rating-good';
  }
  if (rating>7) {
    return 'rating-above-average';
  }
  if (rating>6) {
    return 'rating-below-average';
  } 
  if (rating>5) {
    return 'rating-poor';
  } 
  return 'rating-terrible';
}