# Security

VitalRings runs inside Home Assistant and handles heart-rate, vitals and weight data, so
reports of security or privacy problems are taken seriously.

## Reporting a problem

Please do not open a public issue for a vulnerability. Use GitHub's private
reporting instead: on this repository, go to **Security > Report a
vulnerability**. You should get a first reply within a week.

Useful to include: the VitalRings and Home Assistant versions, what an attacker
needs (a login, a crafted entity, a pasted card configuration), and what they
gain.

## What VitalRings does and does not do

- It makes no network requests. It only reads data that another integration
  already holds in your Home Assistant.
- Its dashboard card is one JavaScript file served by Home Assistant itself;
  it loads nothing from elsewhere.
- It keeps no store of its own: every figure is worked out from the source
  integration's entities and statistics each time. Its sensors are ordinary
  Home Assistant entities, so the recorder keeps their history like any other
  sensor's, and anyone who can log in to your Home Assistant can read them.
- Its diagnostics download holds no health values, no times and no entity ids;
  it only says which figures exist.

See "Privacy" in the README for where your data is stored and who can read it.
