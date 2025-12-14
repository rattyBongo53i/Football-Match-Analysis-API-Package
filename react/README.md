so far everything is working, but the frontend is a bit confusing, because i don't the master betslip as i add the match, there's no ui for that, also i actually what your help updating the frontend because i don't see an option to add matches to slip to actually build a master betslip from which the generator can generate 
many alternative accumulator slips (100+) by swapping markets/outcomes for some matches, there's no ui for create a master bet slip, add matches into the a slip, select markets/outcomes for each match, review the master slip, trigger the accumulator generator


src/
 ├── components/
 │    ├── match/
 │    │     ├── MatchForm.jsx
 │    │     ├── MatchList.jsx
 │    │     └── MatchCard.jsx
 │    ├── slip/
 │    │     ├── SlipBuilder.jsx
 │    │     ├── SlipMatchRow.jsx
 │    │     └── SlipSummary.jsx
 │    ├── markets/
 │    │     ├── MarketPicker.jsx
 │    │     └── OutcomePicker.jsx
 │    └── shared/
 │          └── …
 ├── pages/
 │    ├── MatchEntry.jsx
 │    ├── SlipMaster.jsx        ← NEW
 │    ├── SlipGenerator.jsx     ← NEW
 │    └── SlipList.jsx          ← NEW
 ├── services/
 │    ├── api.js
 │    ├── slipAPI.js            ← NEW
 │    ├── marketAPI.js          ← NEW
 │    └── generatorAPI.js       ← NEW
 ├── App.jsx
 ├── routes.jsx                 ← NEW
 └── theme.js


the system needs a master Slip builder ui with route /slips/master to Create a master slip, Select matches from the database, Click Add to Slip

Choose:

market

outcome

odds

swappable or not

swap priority

See slip total odds

Save slip to backend

and also A Match Selector UI

A component that shows: Matches from the backend

“Add to Slip” button

Filters (league, date, match search),

and also, A Market Selector UI

Once you add a match to slip, you need to pick:

Market (1X2, BTTS, Over/Under, Asian Handicap…)

Outcome (Home, Draw, Away)

Odds

Confidence %

Swap ability

Generator UI
A page like /slips:id/generator
Where you choose:

Monte Carlo

Coverage Optimization

ML Prediction

And generate over 100 alternative accumulator slips.

src/
 ├── components/
 │    ├── match/
 │    │     ├── MatchForm.jsx
 │    │     ├── MatchList.jsx
 │    │     └── MatchCard.jsx
 │    ├── slip/
 │    │     ├── SlipBuilder.jsx
 │    │     ├── SlipMatchRow.jsx
 │    │     └── SlipSummary.jsx
 │    ├── markets/
 │    │     ├── MarketPicker.jsx
 │    │     └── OutcomePicker.jsx
 │    └── shared/
 │          └── …
 ├── pages/
 │    ├── MatchEntry.jsx
 │    ├── SlipMaster.jsx       
 │    ├── SlipGenerator.jsx    
 │    └── SlipList.jsx         
 ├── services/
 │    ├── api.js
 │    ├── slipAPI.js           
 │    ├── marketAPI.js         
 │    └── generatorAPI.js      
 ├── App.jsx
 ├── routes.jsx                
 └── theme.js



