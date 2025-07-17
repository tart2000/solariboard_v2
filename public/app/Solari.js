// Son long pour l'animation
var longSound = new Audio("/sound/split_flap_long.mp3");
var isPlaying = false;

// Rendre les variables globales pour accès depuis HTML
window.soundEnabled = false; // Son désactivé par défaut
window.isPlaying = isPlaying;

// Fonction pour démarrer le son
function startLongSound() {
  if (!window.soundEnabled || isPlaying) return;
  
  try {
    isPlaying = true;
    window.isPlaying = true; // Mettre à jour la variable globale
    longSound.currentTime = 0;
    longSound.play().catch(function(error) {
      console.log('Erreur lecture son:', error);
      isPlaying = false;
      window.isPlaying = false;
    });
  } catch (error) {
    console.log('Erreur son:', error);
    isPlaying = false;
    window.isPlaying = false;
  }
}

// Fonction pour arrêter le son
function stopLongSound() {
  if (isPlaying) {
    isPlaying = false;
    window.isPlaying = false; // Mettre à jour la variable globale
    longSound.pause();
    longSound.currentTime = 0;
  }
}

// Rendre les fonctions globales
window.startLongSound = startLongSound;
window.stopLongSound = stopLongSound;

// Précharger l'audio
longSound.addEventListener('canplaythrough', function() {
  console.log('Audio chargé et prêt');
});

// Activer le son après une interaction utilisateur
function enableSound() {
  window.soundEnabled = true; // Mettre à jour la variable globale
  console.log('Son activé');
}



/*global THREE,Stats,_,requestAnimFrame,Events */
String.prototype.rpad = function(padString, length) {
  var str = this;
  while (str.length < length) {
    str = str + padString;
  }
  return str;
};

String.prototype.truncate = function(length) {
  this.length = length;
  return this;
};

window.requestAnimFrame = (function(callback) {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();

var Solari = function() {
  this.animate = false;
  this.flaps = [];
  this.rows = [];
  this.y = 0;
  this.width = window.innerWidth;
  this.height = window.innerHeight;
  this.aspect = this.width / this.height;
  this.renderer = new THREE.WebGLRenderer();
  this.renderer.sortObjects = false;

  this.camera = new THREE.PerspectiveCamera(
    20.0,
    window.innerWidth / window.innerHeight,
    this.NEAR,
    this.FAR
  );
  this.scene = new THREE.Scene();

  this.renderer.setSize(this.width, this.height);

  this.pointLight = new THREE.PointLight(0xffffff);
  this.ambientLight = new THREE.AmbientLight(0x333333);

  this.pointLight.position.x = 800;
  this.pointLight.position.y = 500;
  this.pointLight.position.z = 1000;

  this.scene.add(this.pointLight);
  this.scene.add(this.ambientLight);

  // Pull the camera back
  this.camera.position.z = 2900; // old : 3200 change to zoom
  this.camera.lookAt(new THREE.Vector3(0, 0, 0));

  this.el = this.renderer.domElement;
};

Solari.prototype = _.extend(
  {
    VIEW_ANGLE: 45,
    NEAR: 1,
    FAR: 10000,
    render: function() {
      this.renderer.render(this.scene, this.camera);
      if (this.showStats) this.stats.update();
    },
    add: function(row) {
      this.rows.push(row);
      this.flaps = this.flaps.concat(row.flaps);

      var self = this;
      _.each(row.flaps, function(flap) {
        _.each(flap.objToRender, function(obj) {
          self.scene.add(obj);
        });
      });
      this.y += row.height + 10;

      this.camera.position.x = (row.x - 10) / 2;
      this.camera.position.y = -((row.y - row.height / 2) / 2);

      window.addEventListener("resize", _.bind(this.resizeHandler, this));

      return this;
    },
    displayStats: function() {
      this.showStats = true;
      this.stats = new Stats();
      this.stats.domElement.style.position = "absolute";
      this.stats.domElement.style.top = "0px";
      document.body.appendChild(this.stats.domElement);
    },
    update: function(diff) {
      var i,
        flaps = this.flaps,
        done = true;

      for (i = 0; i < flaps.length; i++) {
        done = flaps[i].update(diff) && done;
      }
      return done;
    },
    start: function() {
      var self = this,
        lastTime = new Date().getTime();

      function animate() {
        // Démarrer le son seulement si l'utilisateur l'a activé ET que soundEnabled est true
        if (!isPlaying && window.soundEnabled) {
          startLongSound();
        }
        
        // update
        var time = new Date().getTime();
        var timeDiff = time - lastTime;
        lastTime = time;

        // render
        self.anim = !self.update(timeDiff);
        self.render();

        // request new frame
        if (self.anim) {
          requestAnimFrame(animate);
        } else {
          // Arrêter le son quand l'animation est finie
          if (window.soundEnabled) {
            stopLongSound();
          }
          setTimeout(function() {
            animate(new Date().getTime());
          }, 2000);
        }
      }
      animate();

      this.trigger("start");
    },
    setMessage: function(msg) {
      _.each(this.rows, function(row, i) {
        row.setChars(msg[i] ? msg[i] : " ");
      });
      return this;
    },
    resizeHandler: function() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);

      this.render();
    }
  },
  Events
);
