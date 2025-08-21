// Configuration Supabase pour le client-side
// Les variables d'environnement seront injectées par le serveur
var supabaseUrl = 'your-supabase-url';
var supabaseAnonKey = 'your-supabase-anon-key';

// Créer le client Supabase
var supabase = window.supabase || null;

// Fonction pour initialiser Supabase
function initSupabase() {
  return new Promise(function(resolve, reject) {
    if (typeof window !== 'undefined' && !window.supabase) {
      try {
        // Récupérer la configuration depuis le serveur
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/config', false); // Synchronous pour simplicité
        xhr.send();
        
        if (xhr.status === 200) {
          var config = JSON.parse(xhr.responseText);
          
          supabaseUrl = config.supabaseUrl;
          supabaseAnonKey = config.supabaseAnonKey;
          
          console.log('Configuration Supabase récupérée');
          
          if (!supabaseUrl || !supabaseAnonKey) {
            reject(new Error('URL ou clé Supabase manquante'));
            return;
          }
          
          // Charger Supabase depuis CDN si pas encore chargé
          var script = document.createElement('script');
          script.src = 'https://unpkg.com/@supabase/supabase-js@2';
          script.onload = function() {
            try {
              window.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
              supabaseReady = true;
              console.log('Supabase initialisé avec succès');
              resolve();
            } catch (error) {
              console.error('Erreur création client Supabase:', error);
              reject(error);
            }
          };
          script.onerror = function() {
            reject(new Error('Erreur chargement script Supabase'));
          };
          document.head.appendChild(script);
        } else {
          reject(new Error('Erreur HTTP: ' + xhr.status));
        }
      } catch (error) {
        console.error('Erreur chargement config Supabase:', error);
        reject(error);
      }
    } else {
      // Supabase déjà initialisé
      resolve();
    }
  });
}

// Fonction pour récupérer les messages d'un client
function getMessagesByClient(client) {
  return new Promise(function(resolve) {
    try {
      // Attendre que Supabase soit prêt
      waitForSupabase().then(function() {
        if (!window.supabase) {
          console.error('Supabase non initialisé');
          resolve([]);
          return;
        }
        
        console.log('Récupération messages pour client:', client);
        
        window.supabase
          .from('messages')
          .select('*')
          .eq('client', client)
          .order('created_at', { ascending: false })
          .then(function(result) {
            var data = result.data;
            var error = result.error;
            
            if (error) {
              console.error('Erreur Supabase:', error);
              resolve([]);
              return;
            }
            
            console.log('Messages récupérés avec succès');
            resolve(data || []);
          })
          .catch(function(error) {
            console.error('Erreur getMessagesByClient:', error);
            resolve([]);
          });
      });
    } catch (error) {
      console.error('Erreur getMessagesByClient:', error);
      resolve([]);
    }
  });
}

// Fonction pour ajouter un message
function addMessage(content, client) {
  return new Promise(function(resolve) {
    try {
      // Attendre que Supabase soit prêt
      waitForSupabase().then(function() {
        if (!window.supabase) {
          console.error('Supabase non initialisé');
          resolve(false);
          return;
        }
        
        window.supabase
          .from('messages')
          .insert([
            {
              content: content,
              client: client
              // created_at sera automatiquement généré par Supabase
            }
          ])
          .then(function(result) {
            var error = result.error;
            
            if (error) {
              console.error('Erreur ajout message:', error);
              resolve(false);
              return;
            }
            
            resolve(true);
          })
          .catch(function(error) {
            console.error('Erreur addMessage:', error);
            resolve(false);
          });
      });
    } catch (error) {
      console.error('Erreur addMessage:', error);
      resolve(false);
    }
  });
}

// Fonction pour supprimer un message
function deleteMessage(id) {
  return new Promise(function(resolve) {
    try {
      if (!window.supabase) {
        console.error('Supabase non initialisé');
        resolve(false);
        return;
      }
      
      console.log('Suppression du message en cours');
      
      window.supabase
        .from('messages')
        .delete()
        .eq('id', id)
        .then(function(result) {
          var error = result.error;
          
          if (error) {
            console.error('Erreur suppression message:', error);
            resolve(false);
            return;
          }
          
          console.log('Message supprimé avec succès');
          resolve(true);
        })
        .catch(function(error) {
          console.error('Erreur deleteMessage:', error);
          resolve(false);
        });
    } catch (error) {
      console.error('Erreur deleteMessage:', error);
      resolve(false);
    }
  });
}

// Fonction pour supprimer tous les messages d'un client
function deleteAllMessages(client) {
  return new Promise(function(resolve) {
    try {
      if (!window.supabase) {
        console.error('Supabase non initialisé');
        resolve(false);
        return;
      }
      
      console.log('Suppression de tous les messages en cours');
      
      window.supabase
        .from('messages')
        .delete()
        .eq('client', client)
        .then(function(result) {
          var error = result.error;
          
          if (error) {
            console.error('Erreur suppression tous les messages:', error);
            resolve(false);
            return;
          }
          
          console.log('Tous les messages supprimés avec succès');
          resolve(true);
        })
        .catch(function(error) {
          console.error('Erreur deleteAllMessages:', error);
          resolve(false);
        });
    } catch (error) {
      console.error('Erreur deleteAllMessages:', error);
      resolve(false);
    }
  });
}

// Variable pour tracker si Supabase est prêt
var supabaseReady = false;

// Fonction pour attendre que Supabase soit prêt
function waitForSupabase() {
  return new Promise(function(resolve) {
    if (supabaseReady && window.supabase) {
      resolve();
    } else {
      var checkInterval = setInterval(function() {
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