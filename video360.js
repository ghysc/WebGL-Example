"use strict";

/**
 * Global (html5 canvas and gl context)
 * **/
var canvasGL;
var gl;

/**
 * Global (geometry VAO id, shader id, texture id)
 * **/
let M_PI=22/7;
let nbStack = 15;
let nbSlice = 15;
var sphereVAO;
var triangleVAO;

var shader360;
var texture360;

var modelview;
var projection;

var angleViewX = 0,angleViewY = 0;
var oldMouseX,oldMouseY;

let mouseSpeed=300;
var mouseDown=false;

/**
 * main, mainLoop
 * **/
window.addEventListener("load",main);

function main() {
    canvasGL=document.getElementById("canvasGL");
    gl=canvasGL.getContext("webgl2");
    if (!gl) {
      alert("cant support webGL2 context");
    }
    else {
      console.log(
        gl.getParameter( gl.VERSION ) + " | " +
        gl.getParameter( gl.VENDOR ) + " | " +
        gl.getParameter( gl.RENDERER ) + " | " +
        gl.getParameter( gl.SHADING_LANGUAGE_VERSION )
      );

   		// callback for mouse events
      canvasGL.addEventListener('mousedown',handleMouseDown,false);
      canvasGL.addEventListener('mousemove',handleMouseMove,false);
      canvasGL.addEventListener('mouseup',handleMouseUp,false);

      init();
      mainLoop();
    }
}

/**
 * mainLoop : update, draw, etc
 * **/
function mainLoop() {
    update();
    draw();
    window.requestAnimationFrame(mainLoop);
}

/**
 * init : webGL and data  initializations
 * **/

function init() {
    gl.clearColor(1,1,1,1);
    gl.enable(gl.DEPTH_TEST);

    gl.viewport(0,0,canvasGL.width,canvasGL.height);

    projection = new Mat4();
    modelview = new Mat4();
    projection.setFrustum(-0.1, 0.1, -0.1, 0.1, 0.1, 1000);

    shader360 = initProgram("shader360");
    triangleVAO = initTriangleVAO();
    sphereVAO = initSphereVAO();
    // texture360 = initTexture("image");
    texture360 = initTexture("video360");
}

function initTriangleVAO() {
  var position=[-0.5,0.5,0.0, 0.5,-0.5,0.0, -0.7,-1.0,0.0];
  var texCoord=[0.0,0.0, 1.0,0.0, 0.0,1.0];
  var element=[0,1,2];

  // init attribute buffer
  var triangleBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);

  var textureBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STATIC_DRAW);

  var triangleElementBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleElementBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(element), gl.STATIC_DRAW);

  // init vao
  var vao=gl.createVertexArray();
  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleElementBuffer);
  // pos
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer);
  gl.vertexAttribPointer(0,3,gl.FLOAT,gl.FALSE,0,0);
  gl.enableVertexAttribArray(0);
  // texture coord
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
  gl.vertexAttribPointer(1,2,gl.FLOAT,gl.FALSE,0,0);
  gl.enableVertexAttribArray(1);

  gl.bindVertexArray(null);

  return vao;
}

function initSphereVAO() {
    var vao=gl.createVertexArray();
    gl.bindVertexArray(vao);

    let vertices = new Array();
    let texCoord = new Array();
    let indices = new Array();

    // Calc The Vertices
    for (let i = 0; i <= nbStack; ++i){
        let phi = (M_PI / nbStack) * i;
        // Loop Through Slices
        for (let j = 0; j <= nbSlice; ++j){
            let theta = ((2 * M_PI) / nbSlice) * j;
            // Calc The Vertex Positions
            let x = Math.cos (theta) * Math.sin (phi);
            let y = Math.cos (phi);
            let z = Math.sin (theta) * Math.sin (phi);

            // Push Back Vertex Data
            vertices.push(x);
            vertices.push(y);
            vertices.push(z);

            texCoord.push(j / nbSlice);
            texCoord.push(i / nbStack);
        }
    }

    // Calc The Index Positions
    for (let i = 0; i < nbSlice * nbStack + nbSlice; ++i){
        indices.push (i);
        indices.push (i + nbSlice + 1);
        indices.push (i + nbSlice);

        indices.push (i + nbSlice + 1);
        indices.push (i);
        indices.push (i + 1);
    }

    // init attribute buffer
    var sphereBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    var textureBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STATIC_DRAW);

    var sphereElementBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereElementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                  new Uint16Array(indices), gl.STATIC_DRAW);

    // init vao
    var vao=gl.createVertexArray();
    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereElementBuffer);
    // pos
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.vertexAttribPointer(0,3,gl.FLOAT,gl.FALSE,0,0);
    gl.enableVertexAttribArray(0);
    // texture coord
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.vertexAttribPointer(1,2,gl.FLOAT,gl.FALSE,0,0);
    gl.enableVertexAttribArray(1);

    gl.bindVertexArray(null);

    return vao;
}

/**
 * update :
 * **/
function update() {
  // Video texture
  var imageData=document.getElementById("video360");
  gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,texture360);
	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,imageData);

  // Transformations
  modelview.setIdentity();
  modelview.translate(0, 0, -document.getElementById("depth").value);
  // Computed in functions at the end
  modelview.rotateX(angleViewX);
  modelview.rotateY(angleViewY);
}

/**
 * draw
 * **/
function draw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(shader360);

  // set up uniform
  var textureLocation=gl.getUniformLocation(shader360, 'image');
  var modelviewLocation=gl.getUniformLocation(shader360, 'modelview');
  var projectionLocation=gl.getUniformLocation(shader360, 'projection');

  gl.uniform1i(textureLocation,0);
  gl.uniformMatrix4fv(modelviewLocation, gl.FALSE, modelview.fv);
  gl.uniformMatrix4fv(projectionLocation, gl.FALSE, projection.fv);

  gl.bindVertexArray(sphereVAO);

  //gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
  gl.drawElements(gl.TRIANGLES, (nbSlice * nbStack + nbSlice) * 6, gl.UNSIGNED_SHORT, 0);

  gl.useProgram(null);
  gl.bindVertexArray(null);
}

/** ****************************************
 *  reads shader (sources in html : tag <script ...type="x-shader"> ) and compile
 * **/
function compileShader(id) {
  var shaderScript = document.getElementById(id);
  var k = shaderScript.firstChild;
  var str=k.textContent;
  console.log(str);
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
     shader = gl.createShader(gl.FRAGMENT_SHADER);
  }
  else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  }
  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(id+"\n"+gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
 }

/** ******************************************* */
/** create the program shader (vertex+fragment) :
 *   - sources are in html script tags : id+"-vs" for the vertex shader, id+"-fs" for the fragment shader
 *
 */
function initProgram(id) {
	var programShader=gl.createProgram();
	var vert=compileShader(id+"-vs");
	var frag=compileShader(id+"-fs");
	gl.attachShader(programShader,vert);
	gl.attachShader(programShader,frag);
	gl.linkProgram(programShader);
	if (!gl.getProgramParameter(programShader,gl.LINK_STATUS)) {
		alert(gl.getProgramInfoLog(programShader));
		return null;
	}
	return programShader;
}

/** *****************************************************
 * Init texture from html id
 * **/

function initTexture(id) {
	var imageData=document.getElementById(id);
	console.log(imageData.nodeType);

	var textureId=gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,textureId);

	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,imageData);

	return textureId;
}


/** ******************************************* */
/** call the picking when mouse down (automatically called : see initGL() for the callback set)
 *
 */
function handleMouseDown(event) {
  	// get the mouse relative to canvas
  	oldMouseX = event.layerX-canvasGL.offsetLeft;
  	oldMouseY = canvasGL.height-(event.layerY-canvasGL.offsetTop)-1.0;
  	mouseDown=true;
}

function handleMouseMove(event) {
  	// get the mouse relative to canvas
  	if (mouseDown) {
      	var mouseX = event.layerX-canvasGL.offsetLeft;
      	var mouseY = canvasGL.height-(event.layerY-canvasGL.offsetTop)-1.0;

        angleViewY -= (mouseX - oldMouseX) / mouseSpeed;
        angleViewX += (mouseY - oldMouseY) / mouseSpeed;
        angleViewX = Math.clamp(angleViewX, -1.5, 1.5);

      	oldMouseX=mouseX;
      	oldMouseY=mouseY;
  	}
}

function handleMouseUp(event) {
  	mouseDown=false;
}

/**
 * Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
 * params: val, min, max
 * Author: Jakub Korzeniowski
 * Agency: Softhis
 * http://www.softhis.com
 */
(function(){Math.clamp=function(a,b,c){return Math.max(b,Math.min(c,a));};})();
