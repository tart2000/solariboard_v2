// Configuration Supabase pour le client-side
// Les variables d'environnement seront injectées par le serveur
var supabaseUrl = 'your-supabase-url';
var supabaseAnonKey = 'your-supabase-anon-key';

// Créer le client Supabase
var supabase = window.supabase || null;

// Fonction pour initialiser Supabase
function initSupabase() {
  return new Promise(function(resolve, reject) {
    debugLog('Début initialisation Supabase...');
    
    if (typeof window !== 'undefined' && !window.supabase) {
      try {
        debugLog('Récupération config depuis /api/config...');
        
        // Récupérer la configuration depuis le serveur
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/config', false); // Synchronous pour simplicité
        xhr.send();
        
        debugLog('Réponse API config: ' + xhr.status);
        
        if (xhr.status === 200) {
          var config = JSON.parse(xhr.responseText);
          
          supabaseUrl = config.supabaseUrl;
          supabaseAnonKey = config.supabaseAnonKey;
          
          debugLog('Config récupérée - URL: ' + (supabaseUrl ? 'Défini' : 'Manquant'));
          debugLog('Config récupérée - Key: ' + (supabaseAnonKey ? 'Défini' : 'Manquant'));
          
          if (!supabaseUrl || !supabaseAnonKey) {
            debugLog('ERREUR: URL ou clé Supabase manquante');
            reject(new Error('URL ou clé Supabase manquante'));
            return;
          }
          
          debugLog('Chargement script Supabase depuis CDN...');
          
          // Charger Supabase depuis CDN si pas encore chargé
          var script = document.createElement('script');
          script.src = 'https://unpkg.com/@supabase/supabase-js@2';
          
          script.onload = function() {
            debugLog('Script Supabase chargé depuis CDN');
            
            // Vérifier immédiatement ce qui est disponible
            debugLog('window.supabase existe: ' + (window.supabase ? 'OUI' : 'NON'));
            
            if (window.supabase) {
              debugLog('Type de window.supabase: ' + typeof window.supabase);
              debugLog('createClient existe: ' + (typeof window.supabase.createClient === 'function' ? 'OUI' : 'NON'));
              
              // Lister toutes les propriétés de window.supabase
              var props = [];
              for (var prop in window.supabase) {
                props.push(prop);
              }
              debugLog('Propriétés de window.supabase: ' + props.join(', '));
            } else {
              // Vérifier s'il y a d'autres objets Supabase
              debugLog('Recherche d\'objets Supabase alternatifs...');
              for (var key in window) {
                if (key.toLowerCase().includes('supabase')) {
                  debugLog('Objet trouvé: window.' + key);
                }
              }
            }
            
            // Essayer de créer le client immédiatement
            if (window.supabase && typeof window.supabase.createClient === 'function') {
              try {
                debugLog('Tentative création client immédiate...');
                window.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
                supabaseReady = true;
                debugLog('Supabase initialisé avec succès (immédiat)');
                resolve();
                return;
              } catch (error) {
                debugLog('Erreur création client immédiate: ' + error.message);
                reject(error);
                return;
              }
            }
            
            // Si pas immédiat, utiliser setInterval mais avec plus de debug
            var attempts = 0;
            var checkSupabase = setInterval(function() {
              attempts++;
              debugLog('Tentative ' + attempts + ': window.supabase = ' + (window.supabase ? 'OUI' : 'NON'));
              
              if (window.supabase && typeof window.supabase.createClient === 'function') {
                clearInterval(checkSupabase);
                try {
                  debugLog('Création client après ' + attempts + ' tentatives...');
                  window.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
                  supabaseReady = true;
                  debugLog('Supabase initialisé avec succès');
                  resolve();
                } catch (error) {
                  debugLog('Erreur création client: ' + error.message);
                  reject(error);
                }
              }
            }, 500); // Vérifier toutes les 500ms
            
            // Timeout plus court pour voir plus vite
            setTimeout(function() {
              clearInterval(checkSupabase);
              debugLog('TIMEOUT: Supabase non disponible après 5 secondes');
              debugLog('État final: window.supabase = ' + (window.supabase ? 'OUI' : 'NON'));
              reject(new Error('Timeout: Supabase non disponible après 5 secondes'));
            }, 5000);
          };
          
          script.onerror = function() {
            debugLog('ERREUR: Chargement script Supabase échoué');
            reject(new Error('Erreur chargement script Supabase'));
          };
          
          document.head.appendChild(script);
          debugLog('Script ajouté au DOM');
          
        } else {
          debugLog('ERREUR HTTP: ' + xhr.status);
          reject(new Error('Erreur HTTP: ' + xhr.status));
        }
      } catch (error) {
        debugLog('ERREUR: ' + error.message);
        reject(error);
      }
    } else {
      debugLog('Supabase déjà initialisé ou window non disponible');
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