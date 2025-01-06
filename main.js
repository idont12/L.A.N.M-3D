// Import Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js';
// import { InteractionManager } from 'three.interactive';


let scene, camera, renderer, controls, interactionManager, objectOnScreen, skySphere, allStages = [], accessibileButtons = [],interactiveObjects=[];

//#region mouseIneractions
const mouse  = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

// Mouse move event handler
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects);

    // Reset all objects that are not currently intersected
    interactiveObjects.forEach(obj => {
        if (!intersects.find(intersect => intersect.object === obj) && obj.userData.isHovered) {
            handleMouseExit(obj);
        }
    });

    // Handle new intersections
    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (!object.userData.isHovered) {
            handleMouseEnter(object);
        }
    }
}

// Mouse enter handler
function handleMouseEnter(object) {
    object.userData.isHovered = true;
    document.body.style.cursor = 'pointer';
    object.dispatchEvent({ type: 'mouseover' });
    // Different hover effects based on object type
    switch(object.userData.type) {
        case 'cube':
            object.material.color.setHex(0xffff00); // Yellow
            object.scale.multiplyScalar(1.2);
            break;
        case 'sphere':
            object.material.color.setHex(0xff00ff); // Purple
            object.scale.multiplyScalar(1.3);
            break;
        case 'cone':
            object.material.color.setHex(0x00ffff); // Cyan
            object.scale.multiplyScalar(1.1);
            break;
    }
}

// Mouse exit handler
function handleMouseExit(object) {
    object.userData.isHovered = false;
    document.body.style.cursor = 'default';
    object.dispatchEvent({ type: 'mouseleave' });
    // Reset object to original state
    object.material.color.setHex(object.userData.originalColor);
    object.scale.copy(object.userData.originalScale);
}

function onClick(event){
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        object.dispatchEvent({ type: 'click' });
    }
   
}

// Handle both mouse and touch events
function handlePointerEvent(event) {
    // Prevent default behavior (like scrolling)
    event.preventDefault();
    
    let clientX, clientY;
    
    // Check if it's a touch event
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    // Convert click coordinates to normalized device coordinates (-1 to +1)
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(interactiveObjects);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        object.dispatchEvent({ type: 'click' });
    }
}
//#endregion

//#region preLoad
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const loadingScreen = document.getElementById('loading-screen');

loadingManager.onProgress = (url, loaded, total) => {
};

/*Update fake loading*/
function loadingTextUpdate(place){
    console.log(place);
    const textAndTimeMessage=
    [
        { time: 4000, text: "Loading..." },
        { time: 8500, text: "Downloading textures..." },
        { time: 8000, text: "Loading HD textures..." },
        { time: 7000, text: "Making things look awesome, hang tight!" },
        { time: 10200, text: "We’re working on the details..." },
        { time: 5700, text: "Your textures are on their way!" },
        { time: 8500, text: "Make sure you have good internet!" },
        { time: 5900, text: "Getting everything picture-perfect..." },
        { time: 10600, text: "Textures incoming, almost there!" },
        { time: 6000, text: "We’re really close now..." },
        { time: 4200, text: "Bringing your screen to life..." },
        { time: 6500, text: "Hold on, we’re almost done!" },
        { time: 7400, text: "Making it look great for you..." },
        { time: 10100, text: "Almost ready, just a moment..." },
        { time: 9800, text: "Final touches are happening now..." },
        { time: 4900, text: "Make sure you have good internet" },
        { time: 14700, text: "Your visuals are on their way..." },
        { time: 7600, text: "We’re putting it all together..." },
        { time: 10100, text: "Make sure you have good internet!" }
      ]

    if(loadingScreen.style.display=="none"){
        return;
    }

    if(place>textAndTimeMessage.length){
        place = 0;
    }
    console.log(textAndTimeMessage[place].text);
    loadingScreen.getElementsByClassName("text")[0].innerText=textAndTimeMessage[place].text;
    place++;
    console.log(place);
    setTimeout(loadingTextUpdate, textAndTimeMessage[place].time,place);
}
loadingTextUpdate(0);
let preLoadTexture = {
    view1: textureLoader.load('./img/Musium/view1.jpg'),
    view2: textureLoader.load('./img/Musium/view2.jpg'),
    view3: textureLoader.load('./img/Musium/view3.jpg'),
    view4: textureLoader.load('./img/Musium/view4.jpg'),
    view5: textureLoader.load('./img/Musium/view5.jpg'),
}

loadingManager.onLoad = ()=>{
    loadingScreen.style.display = 'none';
    init();
}
//#endregion

//Three js start + call to 'start()'
function init() {
    start();

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 1); // Slightly inside the sphere

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.domElement.id = "MuseumCanvas";
    renderer.domElement.style.display = "none";
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding; // Correct color rendering
    document.body.appendChild(renderer.domElement);

    // Interaction Manager
    allStages = [];

    objectOnScreen = [];
    accessibileButtons = [];

    // Create the inner sphere
    const geometry = new THREE.SphereGeometry(20, 64, 64); // Large sphere
    geometry.scale(-1, 1, 1); // Flip normals for inner faces
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    skySphere = new THREE.Mesh(geometry, material);
    scene.add(skySphere);

    preperStages();
    allStages[0].generate();

    // Handle Window Resize
    window.addEventListener('resize', onWindowResize);

    window.addEventListener("mousemove",onMouseMove);
    window.addEventListener('click', handlePointerEvent);
    // Start Animation Loop
    animate();
}

//html start
function start() {
    //start button
    document.getElementById("startButton").addEventListener("click", start3DWorld);

    //full screen
    document.getElementById("fullscreenBut").addEventListener("click", () => {
    if (!document.fullscreenElement) {
      // Request full screen
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      document.body.classList.add("fullScreen");
      document.getElementById("fullscreenBut").getElementsByTagName("img")[0].src="./img/Other/shrinkScreen.svg";
      document.getElementById("fullscreenBut").title="Shrink Screen";
      document.getElementById("fullscreenBut").setAttribute("aria-label","Shrink Screen");
    }
    else {
      // Exit full screen
      document.exitFullscreen().catch(err => {
        console.error(`Error attempting to exit full-screen mode: ${err.message}`);
      });
      document.body.classList.remove("fullScreen");
      document.getElementById("fullscreenBut").getElementsByTagName("img")[0].src="./img/Other/fullScreen.svg";
      document.getElementById("fullscreenBut").setAttribute("aria-label","FullScreen");
      document.getElementById("fullscreenBut").title="Fullscreen";
    }
  });

}

/*class to store the stage info*/
class stage {
    constructor() {
        this.textureUrl;
        this.texture;
        this.generateObjectsCallback = null;
    }

    changeBackgroundTexture() {
        // Texture Loader
        if(this.texture!=null){
            const material = new THREE.MeshBasicMaterial({ map: this.texture });
            skySphere.material = material;
        }
    }

    generateObjects() {
        if (this.generateObjectsCallback) {
            this.generateObjectsCallback();
        } else {
            alert("defultAction");
        }
    }

    generate() {
        this.clearCerentStange();
        hideAllPopups();
        this.changeBackgroundTexture();
        this.generateObjects();

        document.body.style.cursor = 'default';
    }

    clearCerentStange() {
        objectOnScreen.forEach(element => {
            element.removeFromParent();
        });
        objectOnScreen = [];

        accessibileButtons.forEach(button => {
            button.remove();
        });
        accessibileButtons = [];
    }
}

/*class to store and manage the interactive objects*/
class interactedObject {
    constructor({ geometry, material, position, rotation, scale, interactiveDescription,elementColor = 0xffffff}) {
        this.color = elementColor;
        this.object = this.newObject(geometry, material, position, rotation, scale);
        this.objectClickable();
        this.accessibileButton(interactiveDescription);
        this.showOnScreen();
    }

    accessibileButton(interactiveDescription) {
        const newButton = document.createElement("button");
        newButton.setAttribute('aria-label', interactiveDescription);

        // Simulate mouseover on focus
        newButton.addEventListener("focusin", () => {
            lookAt(this.object);
            this.object.dispatchEvent({ type: 'mouseover' });
        });

        // Simulate mouseout on focus loss
        newButton.addEventListener("focusout", () => {
            this.object.dispatchEvent({ type: 'mouseleave' });
        });

        // Simulate click
        newButton.addEventListener("click", () => {
            // Add your click handling logic here
            this.object.dispatchEvent({ type: 'click' });
        });

        accessibileButtons.push(newButton);
        document.getElementById("accessibileButtonsCon").appendChild(newButton);
    }


    newObject(geometry, material, position, rotation, scale) {
        material.color.setHex(this.color);
        const shape = new THREE.Mesh(geometry, material);
        shape.position.set(position.x, position.y, position.z);
        shape.rotation.set(rotation.x, rotation.y, rotation.z);

        shape.userData = {
            originalColor: this.color,
            originalScale: shape.scale.clone(),
            isHovered: false
        };

        objectOnScreen.push(shape);
        interactiveObjects.push(shape);
        return shape;
    }

    objectClickable() {
        // Add Event Listeners
        this.object.addEventListener('mouseover', (event) => {
            // smoothCameraTransition(camera,this.object,10);
            this.selectObject(event.target);
        });

        this.object.addEventListener('mouseleave', (event) => {
            this.unSelectObject(event.target);
        });
    }

    selectObject() {
        document.body.style.cursor = 'pointer';
        const currctScale = this.object.scale;
        this.object.scale.set(currctScale.x + 0.1, currctScale.y + 0.1);

        this.object.material.color.setHex(0x00c3ff);
    }

    unSelectObject() {
        document.body.style.cursor = 'default';
        const currctScale = this.object.scale;
        this.object.scale.set(currctScale.x - 0.1, currctScale.y - 0.1);

        this.object.material.color.setHex(this.color);
    }

    showOnScreen() {
        scene.add(this.object);
    }

    simulateEvent(eventType) {
        const newEvent = new Event(eventType);
        this.object.dispatchEvent(newEvent);
    }

    simulateEvent(eventType, object) {
        const newEvent = new Event(eventType);
        object.dispatchEvent(newEvent);
    }
}

class interactivePlane extends interactedObject {
    constructor({ position, rotation, scale, interactiveDescription, texture,elementColor }) {
        const tex = new THREE.TextureLoader().load(texture);
        const material = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true, // Enable transparency
            alphaTest: 0,    // Discard pixels below this alpha value (optional, for cleaner edges)
            side: THREE.DoubleSide
        });
        const geometry = new THREE.PlaneGeometry(scale.x, scale.y);

        super({
            geometry,
            material,
            position,
            rotation,
            scale,
            interactiveDescription,
            elementColor
        })
    }
}

class pointCircle extends interactivePlane {
    constructor({ position, rotation, scale, interactiveDescription }) {

        super({
            position,
            rotation,
            scale,
            interactiveDescription,
            texture: './img/Other/CircleTexture.png',
            elementColor: 0x09076c
        })
    }
}

class pointIntrest extends interactivePlane {
    constructor({ position, rotation, scale, interactiveDescription }) {

        super({
            position,
            rotation,
            scale,
            interactiveDescription,
            texture: './img/Other/IntestPoint.png',
        })
    }
}

/*preCreate all stages*/
function preperStages() {
    const firstStage = new stage();
    firstStage.texture = preLoadTexture.view1;
    firstStage.generateObjects = () => {

        new preMadeObject().bigTv({
            position: new THREE.Vector3(0, 0, -0.2),
            rotation: new THREE.Vector3(0, 0, -Math.PI / 2),
            scale: new THREE.Vector2(0.3, 0.3)
        });

        new preMadeObject().mounkyDot({
            position: new THREE.Vector3(2, -0.1, 1.2),
            rotation: new THREE.Vector3(0, -Math.PI / 2, 0),
            scale: new THREE.Vector2(0.6, 0.6),
        });

        new preMadeObject().baloon({
            position: new THREE.Vector3(-0.6, 0.3, 3),
            rotation: new THREE.Vector3(0, 0, -Math.PI / 2),
            scale: new THREE.Vector2(0.6, 0.6),
        });

        /*view 2*/
        new preMadeObject().view({
            viewNum:1,
            position: new THREE.Vector3(6.4, -3, 2.7),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });

        /*view 3*/
        new preMadeObject().view({
            viewNum:2,
            position: new THREE.Vector3(7, -3, 9),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });

        /*view 4*/
        new preMadeObject().view({
            viewNum:3,
            position: new THREE.Vector3(-6, -3, 9),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5,1.5),
        });

        /*view 5*/
        new preMadeObject().view({
            viewNum:4,
            position: new THREE.Vector3(-13, -3, 9),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });
       
    };
    allStages.push(firstStage);

    const secendStage = new stage();
    secendStage.texture = preLoadTexture.view2;
    secendStage.generateObjects = () => {
        new preMadeObject().bigTv({
            position: new THREE.Vector3(-0.7, 0, -0.2),
            rotation: new THREE.Vector3(0, 0, -Math.PI / 2),
            scale: new THREE.Vector2(0.3, 0.3)
        });

        new preMadeObject().mounkyDot({
            position: new THREE.Vector3(1, -0.1, 0.8),
            rotation: new THREE.Vector3(0, -Math.PI / 2, 0),
            scale: new THREE.Vector2(0.6, 0.6),
        });

        new preMadeObject().baloon({
            position: new THREE.Vector3(-1.7, 0.3, 2.5),
            rotation: new THREE.Vector3(0, (-Math.PI / 4), 0),
            scale: new THREE.Vector2(0.6, 0.6),
        });

        new preMadeObject().glass({
            position: new THREE.Vector3(-4, -0.4,2.3),
            rotation: new THREE.Vector3(0, -Math.PI / 2, 0),
            scale: new THREE.Vector2(0.6, 0.6),
        });


        /*view 1*/
        new preMadeObject().view({
            viewNum:0,
            position: new THREE.Vector3(-5, -3, -2),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });

        /*view 3*/
        new preMadeObject().view({
            viewNum:2,
            position: new THREE.Vector3(1, -3, 7),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });

        /*view 4*/
        new preMadeObject().view({
            viewNum:3,
            position: new THREE.Vector3(-12, -3, 7),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });
       
    };
    allStages.push(secendStage);

    const ThirdStage = new stage();
    ThirdStage.texture = preLoadTexture.view3;
    ThirdStage.generateObjects = () => {
        new preMadeObject().bigTv({
            position: new THREE.Vector3(-0.6, 0, -0.2),
            rotation: new THREE.Vector3(0, 0, -Math.PI / 2),
            scale: new THREE.Vector2(0.3, 0.3)
        });

        new preMadeObject().mounkyDot({
            position: new THREE.Vector3(0.2, -0.2, 0.2),
            rotation: new THREE.Vector3(0, 0, -Math.PI / 2),
            scale: new THREE.Vector2(0.3, 0.3),
        });

        new preMadeObject().baloon({
            position: new THREE.Vector3(-2, 0.3, 1.4),
            rotation: new THREE.Vector3(0, (-Math.PI / 2), 0),
            scale: new THREE.Vector2(0.6, 0.6),
        });

        new preMadeObject().glass({
            position: new THREE.Vector3(-4, -0.4,1.2),
            rotation: new THREE.Vector3(0, -Math.PI / 2, 0),
            scale: new THREE.Vector2(0.6, 0.6),
        });


        /*view 1*/
        new preMadeObject().view({
            viewNum:0,
            position: new THREE.Vector3(-8, -2.8, -10),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });

        /*view 2*/
        new preMadeObject().view({
            viewNum:1,
            position: new THREE.Vector3(-4.3, -3, -7.8),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.6, 1.6),
        });

        /*view 4*/
        new preMadeObject().view({
            viewNum:3,
            position: new THREE.Vector3(-15, -3, 1.5),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.8, 1.8),
        });

        /*view 5*/
        new preMadeObject().view({
            viewNum:4,
            position: new THREE.Vector3(-18, -2.5, 1.5),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });
    };
    allStages.push(ThirdStage);

    const FourStage = new stage();
    FourStage.texture = preLoadTexture.view4;
    FourStage.generateObjects = () => {
        new preMadeObject().bigTv({
            position: new THREE.Vector3(1, 0, -1.2),
            rotation: new THREE.Vector3(0, 0,  -Math.PI / 2),
            scale: new THREE.Vector2(0.3, 0.3)
        });

        new preMadeObject().mounkyDot({
            position: new THREE.Vector3(2, -0.2, 0),
            rotation: new THREE.Vector3(0, -Math.PI / 4,0),
            scale: new THREE.Vector2(0.3, 0.3),
        });

        new preMadeObject().baloon({
            position: new THREE.Vector3(1, 0.3, 1.2),
            rotation: new THREE.Vector3(0, (-Math.PI / 2), 0),
            scale: new THREE.Vector2(0.6, 0.6),
        });

        new preMadeObject().keithHaring({
            position: new THREE.Vector3(-2.8, 0.4, -0.4),
            rotation: new THREE.Vector3(0, 0, -Math.PI / 2),
            scale: new THREE.Vector2(0.8, 0.8),
        });

        new preMadeObject().glass({
            position: new THREE.Vector3(-3, -0.6,1.2),
            rotation: new THREE.Vector3(0, -Math.PI / 2, 0),
            scale: new THREE.Vector2(0.6, 0.6),
        });


        /*view 1*/
        new preMadeObject().view({
            viewNum:0,
            position: new THREE.Vector3(8, -2.8, -11),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });

        /*view 2*/
        new preMadeObject().view({
            viewNum:1,
            position: new THREE.Vector3(12, -2.3, -7.8),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });

        /*view 3*/
        new preMadeObject().view({
            viewNum:2,
            position: new THREE.Vector3(13, -2.5, -0.8),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });

        /*view 5*/
        new preMadeObject().view({
            viewNum:4,
            position: new THREE.Vector3(-6, -2.5, 1.6),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });
    };
    allStages.push(FourStage);

    const FiveStage = new stage();
    FiveStage.texture = preLoadTexture.view5;
    FiveStage.generateObjects = () => {

        new preMadeObject().mounkyDot({
            position: new THREE.Vector3(2.5, -0.2, 0),
            rotation: new THREE.Vector3(0, -Math.PI / 4,0),
            scale: new THREE.Vector2(0.3, 0.3),
        });


        new preMadeObject().baloon({
            position: new THREE.Vector3(2, 0.3, 1),
            rotation: new THREE.Vector3(0, -Math.PI / 2, 0),
            scale: new THREE.Vector2(0.4, 0.4)
        });

        new preMadeObject().keithHaring({
            position: new THREE.Vector3(-0.5, 0.4, -1),
            rotation: new THREE.Vector3(0, 0, -Math.PI / 2),
            scale: new THREE.Vector2(0.8, 0.8),
        });

        new preMadeObject().glass({
            position: new THREE.Vector3(-1, -0.6,1.2),
            rotation: new THREE.Vector3(0, -Math.PI / 2, 0),
            scale: new THREE.Vector2(0.4, 0.4),
        });



        /*view 3*/
        new preMadeObject().view({
            viewNum:2,
            position: new THREE.Vector3(15, -2.3, -0.8),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });

        /*view 4*/
        new preMadeObject().view({
            viewNum:3,
            position: new THREE.Vector3(5, -2.5, 0.5),
            rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
            scale: new THREE.Vector2(1.5, 1.5),
        });
       
    };
    allStages.push(FiveStage);

}

/*class to manage the creation of all objects*/
class preMadeObject{
    /*Objects*/
    bigTv({position,rotation,scale}){
        const BigTvPoint = new pointIntrest({
            position,
            rotation,
            scale,
            interactiveDescription: "Website intro video"
        });
        BigTvPoint.object.addEventListener("click", () => {
            displayIframePopup(
                {
                    iframeUrl: "https://www.youtube.com/embed/-Vf1WvB17k8?si=zcc_otakgZcJhBW2&amp;autoplay=1&amp;mute=0",
                });
        });
    }

    mounkyDot({position,rotation,scale}){
        const MounkyDotPoint = new pointIntrest({
            position,
            rotation,
            scale,
            interactiveDescription: "Open section about the fake art 'Dots Mounky' with information about the real Artist and the inspired artwork"
        });
        MounkyDotPoint.object.addEventListener("click", () => {
            displaySidebarInfo(
                {
                    artName:"Dots Obsession",
                    artDate:"1968",
                    bigImgUrl:"./img/ArtWork/Yayoi Kusama - Dots Obsession .jpg",
                    bigImgAlt:"Dots Obsession by Yayoi Kusama",
                    smallImgUrl:"./img/Artist/Yayoi Kusama.png",
                    smallImgAlt:"Yayoi Kusama",
                    artistName: "Yayoi Kusama",
                    famousFor: "Art Installation",
                    wikiUrl:"https://en.wikipedia.org/wiki/Yayoi_Kusama",
                    videoUrl: "https://www.youtube.com/embed/cUJi5uWkQ6U?si=zGbuj_sECA312Usr&amp;autoplay=1&amp;mute=0",
                    personalWebUrl: "https://yayoi-kusama.jp/e/information/"
                });
        });
    }

    baloon({position,rotation,scale}){
        const BaloonPoint = new pointIntrest({
            position,
            rotation,
            scale,
            interactiveDescription: "Open section about the fake art 'Steel Balloon' with information about the real Artist and the inspired artwork"
        });
        BaloonPoint.object.addEventListener("click", () => {
            displaySidebarInfo(
                {
                    artName:"Balloon Dog",
                    artDate:"1994-2000",
                    bigImgUrl:"./img/ArtWork/Jeff Koons - Balloon Dog.jpg",
                    bigImgAlt:"Balloon Dog by Jeff Koons",
                    smallImgUrl:"./img/Artist/Jeff Koons.jpg",
                    smallImgAlt:"Jeff Koons",
                    artistName: "Jeff Koons",
                    famousFor: "Steel Balloons",
                    wikiUrl:"https://en.wikipedia.org/wiki/Jeff_Koons",
                    videoUrl: "https://www.youtube.com/embed/Ll-vICo7qoY?si=TUb8Jr5dyap1FFJp&amp;autoplay=1&amp;mute=0",
                    personalWebUrl: "https://www.jeffkoons.com/"
                });
        });
    }

    keithHaring({position,rotation,scale}){
        const KeithPoint = new pointIntrest({
            position,
            rotation,
            scale,
            interactiveDescription: "Open section about the artwork 'Dancing Man ' with information about the Artist and the artwork"
        });
        KeithPoint.object.addEventListener("click", () => {
            displaySidebarInfo(
                {
                    artName:"Dancing Man",
                    artDate:"1980s",
                    bigImgUrl:"./img/ArtWork/Keith Haring - Dancing Man.jpg",
                    bigImgAlt:"Dancing Man by Keith Haring",
                    smallImgUrl:"./img/Artist/Keith Haring.jpg",
                    smallImgAlt:"Keith Haring",
                    artistName: "Keith Haring",
                    famousFor: "Illustration",
                    wikiUrl:"https://en.wikipedia.org/wiki/Keith_Haring",
                    videoUrl: "https://www.youtube.com/embed/afyBBzvMGek?si=DxFTieWK_qSFb9_K&amp;autoplay=1&amp;mute=0",
                    personalWebUrl: "https://www.haring.com/"
                });
        });
    }

    glass({position,rotation,scale}){
        const GlassPoint = new pointIntrest({
            position,
            rotation,
            scale,
            interactiveDescription: "Open section about the fake art 'Huge Glasses and Cherry' with information about the real Artist and the inspired artwork"
        });
        GlassPoint.object.addEventListener("click", () => {
            displaySidebarInfo(
                {
                    artName:"Spoonbridge and Cherry",
                    artDate:"1988",
                    bigImgUrl:"./img/ArtWork/Claes & Coosje - Spoonbridge and Cherry.jpg",
                    bigImgAlt:"Balloon Dog by Jeff Koons",
                    smallImgUrl:"./img/Artist/Claes & Coosje.jpg",
                    smallImgAlt:"Claes Oldenburg & Coosje van Bruggen",
                    artistName: "Claes Oldenburg & Coosje van Bruggen",
                    famousFor: "Huge Sculptures",
                    wikiUrl:"https://en.wikipedia.org/wiki/Spoonbridge_and_Cherry",
                    videoUrl: "https://www.youtube.com/embed/_83z_mivsIo?si=PxoaSTLbX3gamPsJ"
                });
        });
    }




    /*Places*/

    view({viewNum,position,rotation,scale}){
        const newCircle = new pointCircle({
            position,
            rotation,
            scale,
            interactiveDescription: `change view position to position ${viewNum}`
        }
        );
        newCircle.object.addEventListener("click", () => {
            allStages[viewNum].generate();
        });
    }
}

/*change rander on change window size*/
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/*animation*/
function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}


//#region  Camera Control
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let lastTouchPosition = null;
let viewportDimensions = {
    width: window.innerWidth,
    height: window.innerHeight
};
// Update viewport dimensions when window resizes
window.addEventListener('resize', () => {
    viewportDimensions = {
        width: window.innerWidth,
        height: window.innerHeight
    };
});

document.addEventListener('mousedown', () => {
    isDragging = true;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('mousemove', (event) => {
    if (!isDragging) return;

    const deltaMove = {
        x: event.movementX,
        y: event.movementY,
    };

    pointerLookAround(deltaMove);
});

document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        lastTouchPosition = { x: touch.clientX, y: touch.clientY };
        isDragging = true;
    }
});
document.addEventListener('touchmove', (event) => {
    if (!isDragging || event.touches.length === 0) return;
    const touch = event.touches[0];
    const currentTouchPosition = { x: touch.clientX, y: touch.clientY };
    // Calculate delta movement
    const deltaMove = {
        x: currentTouchPosition.x - (lastTouchPosition?.x || currentTouchPosition.x),
        y: currentTouchPosition.y - (lastTouchPosition?.y || currentTouchPosition.y),
    };
    lastTouchPosition = currentTouchPosition;
    pointerLookAround(deltaMove);
});

document.addEventListener('touchend', () => {
    isDragging = false;
    lastTouchPosition = null;
});

function pointerLookAround(deltaMove) {
    const rotationSpeed = 0.002; // Adjust sensitivity
    const quaternionX = new THREE.Quaternion();
    const quaternionY = new THREE.Quaternion();
    quaternionY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaMove.x * rotationSpeed); // Horizontal rotation
    quaternionX.setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaMove.y * rotationSpeed); // Vertical rotation
    camera.quaternion.multiplyQuaternions(quaternionY, camera.quaternion);
    camera.quaternion.multiplyQuaternions(camera.quaternion, quaternionX);
}

function lookAt(targetObject) {
    // Calculate the target's world position
    const targetPosition = new THREE.Vector3();
    targetObject.getWorldPosition(targetPosition);

    // Calculate the direction vector from the camera to the target position
    const direction = new THREE.Vector3();
    direction.subVectors(targetPosition, camera.position).normalize();

    // Create a quaternion to represent the camera's new orientation
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);

    // Set the camera's quaternion to the target quaternion
    camera.quaternion.copy(targetQuaternion);

    // Ensure the camera's "up" vector remains consistent
    camera.lookAt(targetPosition);

}
//#endregion

//general html shit
function displayIframePopup({ iframeUrl, artistName, famousFor }) {
    hideAllPopups();
    const element = document.getElementById("iframePopup");

    // Ensure autoplay and mute are set correctly in the iframe URL
    const autoplayUrl = new URL(iframeUrl);
    autoplayUrl.searchParams.set('autoplay', '1'); // Enable autoplay
    autoplayUrl.searchParams.set('mute', '1');    // Mute to allow autoplay on most browsers

    // Set the iframe's src
    element.getElementsByTagName("iframe")[0].src = autoplayUrl.toString();

    // Update artist info
    updateDisplyedInfo(element, "artistName", artistName);
    updateDisplyedInfo(element, "famousFor", famousFor);

    // Handle close button
    element.getElementsByTagName("button")[0].onclick = () => {
        hideAllPopups();
        // Reset iframe source to avoid continued playback
        element.getElementsByTagName("iframe")[0].src = "./loadingIframePage.html";
    };

    // Show the popup
    element.classList.add("show");
}

function displaySidebarInfo({ artName, artDate, bigImgUrl, bigImgAlt, smallImgUrl, smallImgAlt, artistName, famousFor, wikiUrl, videoUrl, personalWebUrl}) {
    hideAllPopups();
    const element = document.getElementById("sideBanner");

    // Update pics
    updateDisplyedImg(element, "bigPic", bigImgUrl);
    updateDisplyedImg(element, "smallPic", smallImgUrl);

    // Update artwork info
    updateDisplyedInfo(element, "artName", artName);
    updateDisplyedInfo(element, "artDate", artDate);

    // Update artist info
    updateDisplyedInfo(element, "artistName", artistName);
    updateDisplyedInfo(element, "famousFor", famousFor);

    // Update links
    updateDisplayedLink(element,"wikiAction",wikiUrl);
    updateDisplayedLink(element,"personalWebAction",personalWebUrl);

    //Update Butttons
    updateDisplayedIframeButtons(element,"videoAction", videoUrl, artistName, famousFor);


    // Handle close button
    element.getElementsByClassName("close")[0].onclick = () => {
        element.classList.remove("show");
    };

    // Show the popup
    element.classList.add("show");
}

function updateDisplyedInfo(element, className, value) {
    if (value) {
        element.getElementsByClassName(className)[0].innerText = value;
    }

    const perentState = value ? "block" : "none";
    element.getElementsByClassName(className)[0].parentElement.style.display = perentState;
}

function updateDisplyedImg(element, className, urlLink,alt) {
    const newElement = element.getElementsByClassName(className)[0];
    if (urlLink) {
        newElement.setAttribute("src",urlLink);
        newElement.setAttribute("alt",alt);
        newElement.setAttribute("title",alt);
    }

    const perentState = urlLink ? "block" : "none";
    newElement.style.display = perentState;
}

function updateDisplayedLink(element, className, value){
    if (value) {
        element.getElementsByClassName(className)[0].href = value;
    }

    const currentState = value ? "inline-block" : "none";
    element.getElementsByClassName(className)[0].style.display = currentState;
}

function updateDisplayedIframeButtons(element, className, iframeUrl, artistName, famousFor){
    if (iframeUrl) {
        element.getElementsByClassName(className)[0].onclick = ()=>{
            element.classList.remove("show");
            displayIframePopup(
                {
                    iframeUrl,
                    artistName,
                    famousFor
                }
            );
        };
    }

    const iframState = iframeUrl ? "inline-block" : "none";
    element.getElementsByClassName(className)[0].style.display = iframState;
}

function hideAllPopups() {
    const allPopup = Array.from(document.getElementsByClassName("popup"));
    allPopup.forEach(popup => {
        if (popup.classList.contains("show")) {
            popup.classList.remove("show");
        }
    });

    const banner = document.getElementById("sideBanner");
    if (sideBanner.classList.contains("show")) {
        sideBanner.classList.remove("show");
    }    
}

//hide start screen and show 3D world
function start3DWorld() {

    document.getElementById("MainPage").style.display = "none";

    displayIframePopup(
        {
            iframeUrl: "https://www.youtube.com/embed/-Vf1WvB17k8?si=zcc_otakgZcJhBW2&amp;autoplay=1&amp;mute=0",
        }
    );
    document.getElementById("accessibileButtonsCon").style.visibility = "visible";
    document.getElementById("MuseumCanvas").style.display = "block";
}

