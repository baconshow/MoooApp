
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

/**
 * @fileOverview Inicialização segura do Firebase Admin SDK.
 * No ambiente de build ou App Hosting, ele tenta usar as credenciais padrão do Google.
 */

let adminApp: App;

if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
    
    // Se houver uma chave de conta de serviço em variável de ambiente, usamos ela.
    // Caso contrário, o Admin SDK usará Application Default Credentials (ADC) automaticamente.
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            adminApp = initializeApp({
                credential: credential.cert(serviceAccount),
                projectId: projectId,
            });
        } catch (e) {
            console.error("[FirebaseAdmin] Erro ao processar FIREBASE_SERVICE_ACCOUNT_KEY:", e);
            adminApp = initializeApp({ projectId: projectId });
        }
    } else {
        // Ideal para ambientes Google Cloud / App Hosting
        adminApp = initializeApp({
            projectId: projectId,
        });
    }
} else {
    adminApp = getApp();
}

// Exportamos o DB apenas se o app foi inicializado corretamente
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export { adminApp };
