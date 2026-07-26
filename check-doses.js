const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const messaging = admin.messaging();

const LATE_THRESHOLD_MIN = 2;
const COLLECTION = 'pillAlertFamily';

async function getDoc(key) {
  const snap = await db.collection(COLLECTION).doc(key).get();
  return snap.exists ? JSON.parse(snap.data().data) : null;
}
async function setDoc(key, val) {
  await db.collection(COLLECTION).doc(key).set({ data: JSON.stringify(val) });
}

async function main() {
  const members = (await getDoc('members')) || [];
  const meds = (await getDoc('meds')) || [];
  let doseLog = (await getDoc('doseLog')) || {};
  let alerts = (await getDoc('alerts')) || [];
  const tokens = (await getDoc('fcmTokens')) || {};

  const now = new Date();
  let changedLog = false;
  let changedAlerts = false;

  for (const med of meds) {
    for (const time of med.times) {
      const key = med.id + '_' + time;
      const entry = doseLog[key] || { status: 'pending' };
      if (entry.status === 'taken') continue;

      const [h, m] = time.split(':').map(Number);
      const doseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
      const diffMin = (now - doseTime) / 60000;
      const isLateOrSkipped = entry.status === 'skipped' || diffMin > LATE_THRESHOLD_MIN;

      // diffMin > -60 evita alertar por dosis de horas futuras del día
      if (isLateOrSkipped && !entry.alerted && diffMin > -60) {
        const member = members.find((mb) => mb.id === med.memberId);
        const memberName = member ? member.name : 'Alguien';
        const text = `⏰ ${memberName} no ha confirmado ${med.name} de las ${time} (más de ${LATE_THRESHOLD_MIN} min de retraso).`;

        alerts.unshift({ id: Date.now() + Math.random(), text, at: new Date().toISOString() });
        changedAlerts = true;
        doseLog[key] = { ...entry, alerted: true };
        changedLog = true;

        const targetTokens = Object.entries(tokens)
          .filter(([memberId]) => Number(memberId) !== med.memberId)
          .map(([, token]) => token)
          .filter(Boolean);

        if (targetTokens.length) {
          try {
            await messaging.sendEachForMulticast({
              tokens: targetTokens,
              notification: { title: 'Pill Alert Family', body: text },
            });
            console.log('Push enviado:', text);
          } catch (e) {
            console.error('Error enviando push:', e.message);
          }
        }
      }
    }
  }

  if (changedLog) await setDoc('doseLog', doseLog);
  if (changedAlerts) await setDoc('alerts', alerts.slice(0, 60));
  console.log('Revisión completada.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
