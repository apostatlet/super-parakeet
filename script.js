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
  const processedTeams = new Set();

  for (let i = 0; i < teams.length; i++) {
    if (processedTeams.has(teams[i].team)) continue; // Skip already processed teams

    const tiedTeams = teams.filter(t => t.points === teams[i].points && !processedTeams.has(t.team));
    if (tiedTeams.length > 1) {
      // Check head-to-head
      const headToHeadResults = calculateHeadToHead(tiedTeams.map(t => t.team));
      if (headToHeadResults.tie) {
        // Unresolved tie; assign same rank
        tiedTeams.forEach(team => {
          rankedTeams.push({ team: team.team, points: team.points, rank: `T-${rank}` });
          processedTeams.add(team.team);
        });
        rank += tiedTeams.length; // Skip all ranks occupied by the tied group
      } else {
        // Resolved tie
        headToHeadResults.standings.forEach(({ team }, idx) => {
          rankedTeams.push({ team, points: teams[i].points, rank: rank + idx });
          processedTeams.add(team);
        });
        rank += headToHeadResults.standings.length;
      }
    } else {
      // No tie
      rankedTeams.push({ team: teams[i].team, points: teams[i].points, rank });
      processedTeams.add(teams[i].team);
      rank++;
    }
  }

  // Ensure proper rank adjustment for sequential teams
  let nextRank = 1;
  rankedTeams.forEach((team, idx) => {
    if (typeof team.rank === "string" && team.rank.startsWith("T-")) {
      const tiedGroupSize = rankedTeams.filter(t => t.rank === team.rank).length;
      nextRank += tiedGroupSize - 1; // Reserve ranks for tied group
    } else {
      team.rank = nextRank;
    }
    nextRank++;
  });

  return rankedTeams;
}

function calculateHeadToHead(tiedTeams) {
  const scores = Object.fromEntries(tiedTeams.map(team => [team, 0]));

  // Extract relevant matchups
  tiedTeams.forEach(teamA => {
    tiedTeams.forEach(teamB => {
      if (teamA !== teamB) {
        const matchup = matchupHistory.find(
          result =>
            result.includes(`${teamA} vs ${teamB}`) || result.includes(`${teamB} vs ${teamA}`)
        );
        if (matchup) {
          const winner = matchup.split(': ')[1].split(' ')[0];
          if (winner === teamA) scores[teamA]++;
        }
      }
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
