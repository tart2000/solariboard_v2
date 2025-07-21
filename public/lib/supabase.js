// Configuration Supabase pour le client-side
// Les variables d'environnement seront injectées par le serveur
let supabaseUrl = 'your-supabase-url';
let supabaseAnonKey = 'your-supabase-anon-key';

// Créer le client Supabase
const supabase = window.supabase || null;

// Fonction pour initialiser Supabase
async function initSupabase() {
  if (typeof window !== 'undefined' && !window.supabase) {
    try {
      // Récupérer la configuration depuis le serveur
      const response = await fetch('/api/config');
      const config = await response.json();
      
      supabaseUrl = config.supabaseUrl;
      supabaseAnonKey = config.supabaseAnonKey;
      
      console.log('Configuration Supabase récupérée');
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('URL ou clé Supabase manquante');
      }
      
      // Charger Supabase depuis CDN si pas encore chargé
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@supabase/supabase-js@2';
      script.onload = function() {
        try {
          window.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
          supabaseReady = true;
          console.log('Supabase initialisé avec succès');
        } catch (error) {
          console.error('Erreur création client Supabase:', error);
        }
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Erreur chargement config Supabase:', error);
    }
  }
}

// Fonction pour récupérer les messages d'un client
async function getMessagesByClient(client) {
  try {
    // Attendre que Supabase soit prêt
    await waitForSupabase();
    
    if (!window.supabase) {
      console.error('Supabase non initialisé');
      return [];
    }
    
    console.log('Récupération messages pour client:', client);
    
    const { data, error } = await window.supabase
      .from('messages')
      .select('*')
      .eq('client', client)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erreur Supabase:', error);
      return [];
    }
    
    console.log('Messages récupérés avec succès');
    return data || [];
  } catch (error) {
    console.error('Erreur getMessagesByClient:', error);
    return [];
  }
}

// Fonction pour ajouter un message
async function addMessage(content, client) {
  try {
    // Attendre que Supabase soit prêt
    await waitForSupabase();
    
    if (!window.supabase) {
      console.error('Supabase non initialisé');
      return false;
    }
    
    const { data, error } = await window.supabase
      .from('messages')
      .insert([
        {
          content: content,
          client: client
          // created_at sera automatiquement généré par Supabase
        }
      ]);
    
    if (error) {
      console.error('Erreur ajout message:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur addMessage:', error);
    return false;
  }
}

// Fonction pour supprimer un message
async function deleteMessage(id) {
  try {
    if (!window.supabase) {
      console.error('Supabase non initialisé');
      return false;
    }
    
    console.log('Suppression du message en cours');
    
    const { error } = await window.supabase
      .from('messages')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erreur suppression message:', error);
      return false;
    }
    
    console.log('Message supprimé avec succès');
    return true;
  } catch (error) {
    console.error('Erreur deleteMessage:', error);
    return false;
  }
}

// Fonction pour supprimer tous les messages d'un client
async function deleteAllMessages(client) {
  try {
    if (!window.supabase) {
      console.error('Supabase non initialisé');
      return false;
    }
    
    console.log('Suppression de tous les messages en cours');
    
    const { error } = await window.supabase
      .from('messages')
      .delete()
      .eq('client', client);
    
    if (error) {
      console.error('Erreur suppression tous les messages:', error);
      return false;
    }
    
    console.log('Tous les messages supprimés avec succès');
    return true;
  } catch (error) {
    console.error('Erreur deleteAllMessages:', error);
    return false;
  }
}

// Variable pour tracker si Supabase est prêt
let supabaseReady = false;

// Fonction pour attendre que Supabase soit prêt
function waitForSupabase() {
  return new Promise((resolve) => {
    if (supabaseReady && window.supabase) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (supabaseReady && window.supabase) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });
}

// Exporter les fonctions
window.SupabaseClient = {
  init: initSupabase,
  getMessagesByClient: getMessagesByClient,
  addMessage: addMessage,
  deleteMessage: deleteMessage,
  deleteAllMessages: deleteAllMessages,
  waitForSupabase: waitForSupabase
}; 