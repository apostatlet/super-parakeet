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
  const standings = Object.entries(results)
    .sort(([, pointsA], [, pointsB]) => pointsB - pointsA)
    .map(([team, points]) => ({ team, points }));

  // Tiebreakers
  const tiedGroups = standings.reduce((acc, { team, points }) => {
    if (!acc[points]) acc[points] = [];
    acc[points].push(team);
    return acc;
  }, {});

  const standingsList = document.getElementById('standings');
  standingsList.innerHTML = standings.map(({ team, points }) => `<li>${team}: ${points} pts</li>`).join('');

  const resultsList = document.getElementById('matchup-results');
  resultsList.innerHTML = matchupHistory.map(result => `<li>${result}</li>`).join('');

  document.getElementById('matchup-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'block';
}
