let items = [];
let matchups = [];
let results = {};
let currentMatchupIndex = 0;
let matchupHistory = [];

document.getElementById('start-button').addEventListener('click', () => {
  const input = document.getElementById('input-list').value;
  items = input.split(',').map(item => item.trim()).filter(item => item !== '');
  if (items.length < 2) {
    alert('Please enter at least two items.');
    return;
  }

  // Initialize results
  results = Object.fromEntries(items.map(item => [item, 0]));

  // Generate all matchups
  matchups = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      matchups.push([items[i], items[j]]);
    }
  }

  // Shuffle matchups
  matchups = matchups.sort(() => Math.random() - 0.5);

  document.getElementById('input-section').style.display = 'none';
  document.getElementById('matchup-section').style.display = 'block';
  showNextMatchup();
});

document.getElementById('option-a').addEventListener('click', () => handleResult(0));
document.getElementById('option-b').addEventListener('click', () => handleResult(1));

function handleResult(winnerIndex) {
  const [itemA, itemB] = matchups[currentMatchupIndex];
  const winner = winnerIndex === 0 ? itemA : itemB;
  results[winner]++;
  matchupHistory.push(`${itemA} vs ${itemB}: ${winner} wins`);
  currentMatchupIndex++;

  if (currentMatchupIndex < matchups.length) {
    showNextMatchup();
  } else {
    showResults();
  }
}

function showNextMatchup() {
  const [itemA, itemB] = matchups[currentMatchupIndex];
  document.getElementById('matchup-title').textContent = `Matchup ${currentMatchupIndex + 1} of ${matchups.length}`;
  document.getElementById('option-a').textContent = itemA;
  document.getElementById('option-b').textContent = itemB;
}

function showResults() {
  const standings = calculateStandings();

  // Display standings
  const standingsList = document.getElementById('standings');
  standingsList.innerHTML = standings.map(({ team, points, rank }) => `<li>${rank}. ${team}: ${points} pts</li>`).join('');

  // Display matchup results
  const resultsList = document.getElementById('matchup-results');
  resultsList.innerHTML = matchupHistory.map(result => `<li>${result}</li>`).join('');

  document.getElementById('matchup-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'block';
}

function calculateStandings() {
  // Sort teams by points
  const teams = Object.entries(results)
    .map(([team, points]) => ({ team, points }))
    .sort((a, b) => b.points - a.points);

  // Handle ties
  let rank = 1;
  const rankedTeams = [];
  for (let i = 0; i < teams.length; i++) {
    if (i > 0 && teams[i].points === teams[i - 1].points) {
      const tiedTeams = [teams[i - 1].team, teams[i].team];
      for (let j = i + 1; j < teams.length && teams[j].points === teams[i].points; j++) {
        tiedTeams.push(teams[j].team);
      }

      // Check head-to-head
      const headToHeadResults = calculateHeadToHead(tiedTeams);
      if (headToHeadResults.tie) {
        // Unresolved tie; assign same rank
        tiedTeams.forEach(team => rankedTeams.push({ team, points: teams[i].points, rank: `T-${rank}` }));
        i += tiedTeams.length - 1;
        rank += tiedTeams.length;
        continue;
      } else {
        // Resolved tie
        headToHeadResults.standings.forEach(({ team }) =>
          rankedTeams.push({ team, points: teams[i].points, rank })
        );
        rank += headToHeadResults.standings.length;
        i += headToHeadResults.standings.length - 1;
        continue;
      }
    }

    // No tie or resolved tie
    rankedTeams.push({ team: teams[i].team, points: teams[i].points, rank });
    rank++;
  }

  return rankedTeams;
}

function calculateHeadToHead(tiedTeams) {
  const scores = Object.fromEntries(tiedTeams.map(team => [team, 0]));

  // Extract relevant matchups
  matchupHistory.forEach(matchup => {
    tiedTeams.forEach(teamA => {
      tiedTeams.forEach(teamB => {
        if (teamA !== teamB && matchup.includes(`${teamA} vs ${teamB}`)) {
          const winner = matchup.split(': ')[1].split(' ')[0];
          if (winner === teamA) scores[teamA]++;
        }
      });
    });
  });

  const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a);
  if (sortedScores[0][1] === sortedScores[sortedScores.length - 1][1]) {
    // All tied
    return { tie: true };
  }

  return {
    tie: false,
    standings: sortedScores.map(([team]) => ({ team })),
  };
}
