import { useEffect, useState, useRef } from 'react'
import './App.css'

import Stats from "three/examples/jsm/libs/stats.module.js";
import waterVert from "./shaders/water.vert";
import waterFrag from "./shaders/water.frag";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from "three";

let vertexShader = waterVert;
let fragmentShader = waterFrag;
let renderer, scene, camera, stats,controls;
let waterMesh, uniforms, geometry, light;

const particles = 100000;


function init() {
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set( 0, 8,  12 );
  camera.lookAt(0,0,0)


  scene = new THREE.Scene();

  uniforms = {
    u_VP: {
      type: "mat4",
      value: new THREE.Matrix4([0, 0, 0, 0])
    },
    u_offset: {
      type: "vec2",
      value: new Float32Array(2)
    },
    u_size: {
      type: "vec2",
      value: new Float32Array(2)
    },
    u_heightMap: {
      type: "sampler2D",
      value: new THREE.TextureLoader().load("assets/water.jpg")
    },
    u_waterHeightMap: {
      type: "sampler2D",
      value: new THREE.TextureLoader().load("assets/water.jpg")
    },
    u_waterTexture: {
      type: "sampler2D",
      value: new THREE.TextureLoader().load("assets/water.jpg")
    },
    u_offsetHeight: {
      type: "float",
      value: 1
    },
    u_maxDeepColor: {
      type: "vec4",
      value: new Float32Array(4)
    },
    u_minDeepColor: {
      type: "vec4",
      value: new Float32Array(4)
    },
    u_maxShallowColor: {
      type: "vec4",
      value: new Float32Array(4)
    },
    u_minShallowColor: {
      type: "vec4",
      value: new Float32Array(4)
    }
  };
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true
  });
  //启用混合
  shaderMaterial.blending = THREE.CustomBlending;
  shaderMaterial.blendSrc = THREE.OneMinusSrcAlphaFactor;
  shaderMaterial.blendDst = THREE.SrcAlphaFactor;
  shaderMaterial.blendEquation = THREE.AddEquation;

  light = new THREE.PointLight();
  light.position.set(1, 1, 1);
  scene.add(light);
  const radius = 200;

  geometry = new THREE.InstancedBufferGeometry();
  // geometry.instanceCount = 112500

  // const positions = [];
  // const colors = [];
  // const sizes = [];

  // const color = new THREE.Color();

  // for (let i = 0; i < particles; i++) {
  //   positions.push((Math.random() * 2 - 1) * radius);
  //   positions.push((Math.random() * 2 - 1) * radius);
  //   positions.push((Math.random() * 2 - 1) * radius);

  //   color.setHSL(i / particles, 1.0, 0.5);

  //   colors.push(color.r, color.g, color.b);

  //   sizes.push(20);
  // }

  // geometry.setAttribute(
  //   "position",
  //   new THREE.Float32BufferAttribute(positions, 3)
  // );
  // geometry.setAttribute(
  //   "color",
  //   new THREE.Float32BufferAttribute(colors, 3)
  // );
  // geometry.setAttribute(
  //   "size",
  //   new THREE.Float32BufferAttribute(sizes, 1).setUsage(
  //     THREE.DynamicDrawUsage
  //   )
  // );
  const vertices = new Float32Array([
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,

    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,
    -1.0, -1.0, 1.0
  ]);


  console.log(shaderMaterial);
  const arrayBuffer = new ArrayBuffer( particles * 12 );
  const interleavedFloat32Buffer1 = new Float32Array( arrayBuffer );
  const interleavedFloat32Buffer2 = new Float32Array( arrayBuffer )
  const n = 900, n2 = n / 2;
  const color = new THREE.Color();
  for ( let i = 0; i < interleavedFloat32Buffer1.length; i += 4 ) {

    // position (first 12 bytes)

    const x = Math.random() * n - n2;
    const y = Math.random() * n - n2;
    const z = Math.random() * n - n2;

    interleavedFloat32Buffer1[ i + 0 ] = x;
    interleavedFloat32Buffer1[ i + 1 ] = y;
    interleavedFloat32Buffer1[ i + 2 ] = z;

    // color (last 4 bytes)

    const vx = ( x / n ) + 0.5;
    const vy = ( y / n ) + 0.5;
    const vz = ( z / n ) + 0.5;

    color.setRGB( vx, vy, vz );

    const j = ( i + 3 ) * 4;

    interleavedFloat32Buffer2[ j + 0 ] = color.r * 255;
    interleavedFloat32Buffer2[ j + 1 ] = color.g * 255;
    interleavedFloat32Buffer2[ j + 2 ] = color.b * 255;
    interleavedFloat32Buffer2[ j + 3 ] = 0; // not needed

  }
  const interleavedBuffer = new THREE.InterleavedBuffer( interleavedFloat32Buffer2, 16 );
  const interleavedBuffer32 = new THREE.InterleavedBuffer( interleavedFloat32Buffer1, 48 );
  const idBuffer = new THREE.InterleavedBuffer( interleavedFloat32Buffer1,1 );


  geometry.setAttribute('position',  new THREE.InterleavedBufferAttribute( interleavedBuffer32, 3, 0, false ));
  // origin
  // gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
  // gl.vertexAttribPointer(instanceAttrib, 1, gl.FLOAT, false, 4, 0);
  // instancedArrays.vertexAttribDivisorANGLE(instanceAttrib, 1);
  geometry.setAttribute('a_position', new THREE.InterleavedBufferAttribute( interleavedBuffer32, 3, 0, false ));
  geometry.setAttribute('a_InstanceID', new THREE.InterleavedBufferAttribute( idBuffer, 4, 0,false ));
  console.log(geometry.setAttribute);
  
    // const  material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  // waterMesh = new THREE.Mesh(geometry, shaderMaterial);


  waterMesh = new THREE.Mesh(geometry, shaderMaterial);

  scene.add(waterMesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  const container = document.getElementById("App");
  controls = new OrbitControls( camera, renderer.domElement );
  controls.update();
  const gridHelper = new THREE.GridHelper( 10, 10);
scene.add( gridHelper );
  container.appendChild(renderer.domElement);

  stats = new Stats();

  container.appendChild(stats.dom);

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  render();
  stats.update();
}

function render() {
  // const time = Date.now() * 0.005;

  // waterMesh.rotation.z = 0.01 * time;

  // const sizes = geometry.attributes.size.array;

  // for (let i = 0; i < particles; i++) {
  // 	sizes[i] = 10 * (1 + Math.sin(0.1 * i + time));
  // }

  // geometry.attributes.size.needsUpdate = true;\\
  // create a simple square shape. We duplicate the top left and bottom right
  // vertices because each vertex needs to appear once per triangle.
  // const vertices = new Float32Array([
  //   -1.0, -1.0, 1.0,
  //   1.0, -1.0, 1.0,
  //   1.0, 1.0, 1.0,

  //   1.0, 1.0, 1.0,
  //   -1.0, 1.0, 1.0,
  //   -1.0, -1.0, 1.0
  // ]);
  // geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  // const mesh = new THREE.Mesh(geometry, material);
  // scene.add(mesh)
  controls.update();
  renderer.render(scene, camera);
}

function App() {
  const [count, setCount] = useState(0)
  let limit = useRef(true)
  useEffect(() => {
    if (limit) {
      init();
      animate();
      console.log(scene);

    }
    limit = false
  }, [])
  return (
    <div className="App">
      <div id="App"></div>
    </div>
  )
}

export default App
