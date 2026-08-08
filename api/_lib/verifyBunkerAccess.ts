import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Ojo: la private key suele venir con \n escapados en la env var de Vercel
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Mapa de qué rol puede hablar con qué búnker.
// Fail-closed por defecto para cualquier búnker no listado (solo admin).
const BUNKER_ROLE_MAP: Record<string, ('admin' | 'ambassador')[]> = {
  secops: ['admin'],
  contabilidad: ['admin'],
  administracion: ['admin'],
  'inversion-exponencial': ['admin'],
  clonacion: ['admin'],
  director: ['admin'],
  'recursos-humanos': ['admin'],
  mantenimiento: ['admin', 'ambassador'],
  marketing: ['admin', 'ambassador'],
  'planificacion-desarrollo': ['admin'],
  'sinfonia-transmision': ['admin', 'ambassador'],
};

export interface VerifiedUser {
  uid: string;
  email: string | undefined;
  role: 'admin' | 'ambassador';
  status: string;
}

export async function verifyBunkerAccess(
  req: VercelRequest,
  res: VercelResponse,
  bunkerId: string
): Promise<VerifiedUser | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Falta token de autenticación.' });
    return null;
  }

  const idToken = authHeader.split('Bearer ')[1];

  let decodedToken: admin.auth.DecodedIdToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch {
    // No filtrar el motivo exacto (token expirado vs. inválido vs. falsificado)
    res.status(401).json({ error: 'Token inválido o expirado.' });
    return null;
  }

  // Fuente de verdad: el documento en /autorizados, NO custom claims todavía
  const userDoc = await admin.firestore().doc(`autorizados/${decodedToken.uid}`).get();

  if (!userDoc.exists) {
    res.status(403).json({ error: 'Usuario no autorizado.' });
    return null;
  }

  const userData = userDoc.data()!;

  if (userData.status !== 'active') {
    res.status(403).json({ error: 'Cuenta no activa.' });
    return null;
  }

  const role = userData.role as 'admin' | 'ambassador';
  const allowedRoles = BUNKER_ROLE_MAP[bunkerId] ?? ['admin']; // fail-closed: bunker no listado = solo admin

  if (!role || !allowedRoles.includes(role)) {
    res.status(403).json({ error: 'Sin permiso para este búnker.' });
    return null;
  }

  return { uid: decodedToken.uid, email: decodedToken.email, role, status: userData.status };
}
