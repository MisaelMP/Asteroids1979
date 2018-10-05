document.addEventListener("DOMContentLoaded", function(){
  // Handler when the DOM is fully loaded
  const FPS = 30; // frames per second
  const SHIP_SIZE = 30; // Ship height on pixels
  const SHIP_THRUST = 5; // acceleration of the ship in pixels per second
  const TURN_SPEED = 360; // turn speed in degrees per second
  const FRICTION = 0.7; // friction coefficient of space 0 = no friction, 1 = friction

  /** @type {HTMLCanvasElement}  */
  const canv = document.getElementById("gameCanvas");
  const ctx = canv.getContext("2d");

  const ship = {
    x: canv.width / 2,
    y: canv.height / 2,
    r: SHIP_SIZE / 2,
    a: 90 / 180 * Math.PI, // Convert to radians
    rot: 0,
    thrusting: false,
    thrust: {
      x: 0,
      y: 0
    }
  }


  // set up event handlers
  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);

  // game loop

  setInterval(update, 1000 / FPS);

  function keyDown(/** @type {keyboardEvent}*/ ev) {
    switch(ev.keyCode) {
      case 37: // left arrow to rotate ship left
        ship.rot = TURN_SPEED / 180 * Math.PI / FPS
          break;
      case 38: // up arrow to thrust the ship onwards
          ship.thrusting = true;
          break;

      case 39: // right arrow to rotate ship right
          ship.rot = -TURN_SPEED / 180 * Math.PI / FPS
          break;
    }
  }

  function keyUp(/** @type {keyboardEvent}*/ ev) {
    switch(ev.keyCode) {
      case 37: // left arrow to STOP rotating ship left
        ship.rot = 0;
          break;
      case 38: // up arrow to STOP thrusting the ship onwards
          ship.thrusting = false;
          break;

      case 39: // right arrow to STOP rotating ship right
          ship.rot = 0;
          break;
    }
  }

  function update() {
    // draw space
    ctx.fillStyle = "#251c1c";
    ctx.fillRect( 0, 0 , canv.width, canv.height);

    // thrust the ship
    if (ship.thrusting) {
      ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
      ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;

      // draw the thruster
      ctx.fillStyle = "#bb320e";
      ctx.strokeStyle = "#e7dd60";
      ctx.kineWeghth = SHIP_SIZE / 10;
      ctx.beginPath();
      ctx.moveTo( // rear left
        ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 *  Math.sin(ship.a)),
        ship.y + ship.r * (2/ 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))

      );

      ctx.lineTo( // rear centre behind the ship
        ship.x - ship.r * 6 / 3 * Math.cos(ship.a),
        ship.y + ship.r * 6/ 3 * Math.sin(ship.a)

      );

      ctx.lineTo( // rear right
        ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
        ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))

      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

    } else {
      ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
      ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    }


    // draw a triangular ship
    ctx.strokeStyle = "#ccbcbc";
    ctx.kineWeghth = SHIP_SIZE / 20;
    ctx.beginPath();
    ctx.moveTo( // Ship nose
      ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
      ship.y - 4 / 3 * ship.r * Math.sin(ship.a)

    );

    ctx.lineTo( // rear left
      ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)),
      ship.y + ship.r * (2/ 3 * Math.sin(ship.a) - Math.cos(ship.a))

    );

    ctx.lineTo( // rear right
      ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)),
      ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a))

    );
    ctx.closePath();
    ctx.stroke();

    // rotate ship
    ship.a += ship.rot;

    // move the ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;


   // handle edge of screen
   if (ship.x < 0 - ship.r) {
     ship.x = canv.width + ship.r;
   } else if (ship.x > canv.width + ship.r) {
     ship.x = 0 - ship.r;
   }
   if (ship.y < 0 - ship.r) {
     ship.y = canv.height + ship.r;
   } else if (ship.y > canv.height + ship.r) {
     ship.y = 0 - ship.r;
   }
    // center dot
    ctx.fillStyle = 'tomato';
    ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);

  }


});
