name: Revisar dosis atrasadas

on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Instalar dependencias
        run: npm install firebase-admin --no-save
      - name: Ejecutar revisión de dosis
        env:
          FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
        run: node check-doses.js
