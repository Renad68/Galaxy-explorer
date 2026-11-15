
import * as THREE from "three";

/* =========================================
   CONFIGURATION
========================================= */

const START_YEAR = 1972;
const END_YEAR = 2003;

const MIN_ZOOM = 4;
const MAX_ZOOM = 35;
const DEFAULT_ZOOM = 15;

const container = document.getElementById("spaceScene");
const slider = document.getElementById("timelineSlider");
const yearDisplay = document.getElementById("yearDisplay");
const missionStatus = document.getElementById("missionStatus");
const eventTitle = document.getElementById("eventTitle");
const eventDescription = document.getElementById("eventDescription");
const loadingMessage = document.getElementById("loadingMessage");
const mapError = document.getElementById("mapError");
const playButton = document.getElementById("playButton");

let scene;
let camera;
let renderer;
let spacecraft;
let stars;

let isPlaying = false;
let playTimer = null;
let pathAnimationTimer = null;

let selectedPath = null;
let selectedPathLine = null;
let pathPoints = [];

let cameraDistance = DEFAULT_ZOOM;
let cameraYaw = 0.45;
let cameraPitch = 0.5;

let isDragging = false;
let previousPointerX = 0;
let previousPointerY = 0;

const cameraTarget = new THREE.Vector3();
const desiredCameraTarget = new THREE.Vector3();
const clock = new THREE.Clock();
const planetObjects = [];

/* =========================================
   SIMPLIFIED PLANET POSITIONS
========================================= */

const PLANET_POSITIONS = {
    Mercury: 2,
    Venus: 3,
    Earth: 4.1,
    Mars: 5.2,
    Jupiter: 7,
    Saturn: 9.2,
    Uranus: 11.1,
    Neptune: 12.8
};

/* =========================================
   HISTORICAL MILESTONES
========================================= */

const milestones = [
    {
        year: 1972,
        name: "Launch",
        description:
            "Pioneer 10 launches from Earth and begins its journey toward Jupiter.",
        position: [PLANET_POSITIONS.Earth, 0, 0]
    },
    {
        year: 1973.9,
        name: "Jupiter Flyby",
        description:
            "Pioneer 10 flies past Jupiter and sends back important scientific observations.",
        position: [7, 0.35, 0.25]
    },
    {
        year: 1976,
        name: "Outer Solar System",
        description:
            "Pioneer 10 continues its outward journey through the Solar System.",
        position: [9, 0.8, 0.5]
    },
    {
        year: 1983,
        name: "Beyond Neptune",
        description:
            "Pioneer 10 passes beyond Neptune's orbital distance from the Sun.",
        position: [14, 1.9, 1]
    },
    {
        year: 1997,
        name: "Routine Contact Ends",
        description:
            "Routine contact with Pioneer 10 comes to an end.",
        position: [19, 2.7, 1.5]
    },
    {
        year: 2002.3,
        name: "Last Telemetry",
        description:
            "Pioneer 10 sends its last telemetry data to Earth.",
        position: [22, 3.1, 1.8]
    },
    {
        year: 2003,
        name: "Last Signal",
        description:
            "The final signal from Pioneer 10 is received on Earth in 2003.",
        position: [23, 3.3, 1.9]
    }
];

/* =========================================
   THREE POSSIBLE PATH OPTIONS
========================================= */

const possiblePaths = {
    taurus: {
        title: "Toward Taurus — Aldebaran",
        description:
            "NASA documents Pioneer 10 as heading generally toward Aldebaran, the red star in the Taurus constellation. The journey to that region is expected to take about two million years. This curve is a simplified visualization, not a precise future-position calculation.",
        color: 0x68e0f7,
        direction: new THREE.Vector3(1, 0.22, 0.35),
        bend: 1.2,
        distance: 24
    },

    interstellar: {
        title: "Into Interstellar Space",
        description:
            "Pioneer 10 followed an outward trajectory beyond the planets and continues away from the Sun. This animation illustrates that outward journey beyond the last signal; it is not live tracking or a newly measured trajectory.",
        color: 0x8ca9ff,
        direction: new THREE.Vector3(1, 0.42, -0.2),
        bend: 2.5,
        distance: 27
    },

    "deep-space": {
        title: "Deep-Space Explorer — Illustrative Scenario",
        description:
            "This is a conceptual path created for the interactive experience. Its curve is not a separate route established by NASA and should not be interpreted as a scientifically predicted future trajectory for Pioneer 10.",
        color: 0xc29aff,
        direction: new THREE.Vector3(0.85, -0.18, 0.65),
        bend: -2,
        distance: 25
    }
};

/* =========================================
   INITIALIZE
========================================= */

function init() {
    try {
        if (!container || !slider) {
            throw new Error("Required page elements were not found.");
        }

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x03060d);

        camera = new THREE.PerspectiveCamera(
            55,
            container.clientWidth / Math.max(container.clientHeight, 1),
            0.1,
            1000
        );

        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 2)
        );

        renderer.setSize(
            container.clientWidth,
            container.clientHeight
        );

        renderer.outputColorSpace = THREE.SRGBColorSpace;

        container.insertBefore(
            renderer.domElement,
            container.firstChild
        );

        createLights();
        createStars();
        createSun();
        createPlanets();
        createSpacecraft();
        createHistoricalTrack();
        setupControls();

        updateTimeline(START_YEAR);

        cameraTarget.copy(spacecraft.position);
        desiredCameraTarget.copy(spacecraft.position);

        updateCamera(true);

        if (loadingMessage) {
            loadingMessage.style.display = "none";
        }

        if (mapError) {
            mapError.hidden = true;
        }

        window.addEventListener("resize", onWindowResize);
        renderer.setAnimationLoop(animate);

    } catch (error) {
        console.error("Pioneer Tracker failed to initialize:", error);

        if (loadingMessage) {
            loadingMessage.style.display = "none";
        }

        if (mapError) {
            mapError.hidden = false;
        }
    }
}

/* =========================================
   LIGHTING
========================================= */

function createLights() {
    scene.add(
        new THREE.AmbientLight(0x8096bd, 1.5)
    );

    const sunLight = new THREE.PointLight(
        0xffd49a,
        160,
        100,
        1.5
    );

    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
}

/* =========================================
   STAR FIELD
========================================= */

function createStars() {
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const index = i * 3;

        positions[index] = (Math.random() - 0.5) * 220;
        positions[index + 1] = (Math.random() - 0.5) * 150;
        positions[index + 2] = (Math.random() - 0.5) * 220;

        const brightness = 0.55 + Math.random() * 0.45;

        colors[index] = brightness * 0.75;
        colors[index + 1] = brightness * 0.85;
        colors[index + 2] = brightness;
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
    );

    geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colors, 3)
    );

    const material = new THREE.PointsMaterial({
        size: 0.13,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    });

    stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

/* =========================================
   SUN
========================================= */

function createSun() {
    const sun = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 40, 40),
        new THREE.MeshBasicMaterial({
            color: 0xffbd4a
        })
    );

    sun.position.set(0, 0, 0);
    scene.add(sun);

    const glow = new THREE.Mesh(
        new THREE.SphereGeometry(1.05, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0xff9e38,
            transparent: true,
            opacity: 0.13,
            side: THREE.BackSide
        })
    );

    sun.add(glow);
}

/* =========================================
   ORBIT LINES
========================================= */

function createOrbit(distance) {
    const points = [];
    const segments = 160;

    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;

        points.push(
            new THREE.Vector3(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            )
        );
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
        color: 0x283954,
        transparent: true,
        opacity: 0.55
    });

    scene.add(new THREE.Line(geometry, material));
}

/* =========================================
   PLANETS
========================================= */

function createPlanets() {
    const planetData = [
        {
            name: "Mercury",
            distance: PLANET_POSITIONS.Mercury,
            size: 0.15,
            color: 0x9b9b9b,
            speed: 0.22
        },
        {
            name: "Venus",
            distance: PLANET_POSITIONS.Venus,
            size: 0.21,
            color: 0xd7b17b,
            speed: 0.16
        },
        {
            name: "Earth",
            distance: PLANET_POSITIONS.Earth,
            size: 0.24,
            color: 0x428bff,
            speed: 0.12
        },
        {
            name: "Mars",
            distance: PLANET_POSITIONS.Mars,
            size: 0.19,
            color: 0xd76a49,
            speed: 0.09
        },
        {
            name: "Jupiter",
            distance: PLANET_POSITIONS.Jupiter,
            size: 0.65,
            color: 0xc99e78,
            speed: 0.05
        },
        {
            name: "Saturn",
            distance: PLANET_POSITIONS.Saturn,
            size: 0.53,
            color: 0xd9c18d,
            speed: 0.035
        },
        {
            name: "Uranus",
            distance: PLANET_POSITIONS.Uranus,
            size: 0.34,
            color: 0x8edce8,
            speed: 0.025
        },
        {
            name: "Neptune",
            distance: PLANET_POSITIONS.Neptune,
            size: 0.33,
            color: 0x4169e1,
            speed: 0.019
        }
    ];

    planetData.forEach((data, index) => {
        createOrbit(data.distance);

        const planet = new THREE.Mesh(
            new THREE.SphereGeometry(data.size, 32, 32),
            new THREE.MeshStandardMaterial({
                color: data.color,
                roughness: 0.9,
                metalness: 0.02
            })
        );

        const initialAngle =
            data.name === "Earth" || data.name === "Jupiter"
                ? 0
                : index * 0.82 + 0.5;

        planet.position.set(
            Math.cos(initialAngle) * data.distance,
            0,
            Math.sin(initialAngle) * data.distance
        );

        planet.userData = {
            ...data,
            angle: initialAngle
        };

        scene.add(planet);
        planetObjects.push(planet);

        if (data.name === "Saturn") {
            const rings = new THREE.Mesh(
                new THREE.RingGeometry(
                    data.size * 1.25,
                    data.size * 1.9,
                    64
                ),
                new THREE.MeshBasicMaterial({
                    color: 0xcdbb94,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.7
                })
            );

            rings.rotation.x = Math.PI / 2.4;
            planet.add(rings);
        }
    });
}

/* =========================================
   PIONEER 10 MODEL
========================================= */

function createSpacecraft() {
    spacecraft = new THREE.Group();

    const metal = new THREE.MeshStandardMaterial({
        color: 0xc6d1df,
        metalness: 0.8,
        roughness: 0.3
    });

    const gold = new THREE.MeshStandardMaterial({
        color: 0xe6b95e,
        metalness: 0.65,
        roughness: 0.35
    });

    const darkMetal = new THREE.MeshStandardMaterial({
        color: 0x45536a,
        metalness: 0.7,
        roughness: 0.4
    });

    const dishMaterial = new THREE.MeshStandardMaterial({
        color: 0xd7e2f1,
        metalness: 0.65,
        roughness: 0.25,
        side: THREE.DoubleSide
    });

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.13, 0.62, 16),
        gold
    );

    body.rotation.z = Math.PI / 2;
    spacecraft.add(body);

    const front = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 0.2, 12),
        metal
    );

    front.rotation.z = Math.PI / 2;
    front.position.x = 0.36;
    spacecraft.add(front);

    const rear = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 0.18, 12),
        darkMetal
    );

    rear.rotation.z = Math.PI / 2;
    rear.position.x = -0.36;
    spacecraft.add(rear);

    const dish = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.48,
            32,
            24,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        ),
        dishMaterial
    );

    dish.position.set(0, 0.34, 0);
    dish.rotation.x = Math.PI;
    spacecraft.add(dish);

    const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.38, 8),
        metal
    );

    mast.position.set(0, 0.13, 0);
    spacecraft.add(mast);

    for (const side of [-1, 1]) {
        const strut = new THREE.Mesh(
            new THREE.CylinderGeometry(0.014, 0.014, 0.46, 6),
            darkMetal
        );

        strut.position.set(side * 0.13, -0.16, 0);
        strut.rotation.z = side * 0.45;
        spacecraft.add(strut);
    }

    const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, 0.55, 6),
        metal
    );

    antenna.position.set(-0.12, 0.48, 0);
    spacecraft.add(antenna);

    const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.105, 16, 16),
        new THREE.MeshBasicMaterial({
            color: 0x68e0f7
        })
    );

    beacon.position.set(0, 0.63, 0);
    spacecraft.add(beacon);

    const beaconLight = new THREE.PointLight(0x68e0f7, 2.5, 5);
    beaconLight.position.copy(beacon.position);
    spacecraft.add(beaconLight);

    spacecraft.scale.setScalar(1.45);
    scene.add(spacecraft);
}

/* =========================================
   HISTORICAL POSITION
========================================= */

function vectorFromArray(array) {
    return new THREE.Vector3(
        array[0],
        array[1],
        array[2]
    );
}

function getHistoricalPosition(year) {
    if (year <= milestones[0].year) {
        return vectorFromArray(milestones[0].position);
    }

    for (let i = 0; i < milestones.length - 1; i++) {
        const start = milestones[i];
        const end = milestones[i + 1];

        if (year <= end.year) {
            const duration = end.year - start.year;

            const progress = duration > 0
                ? (year - start.year) / duration
                : 0;

            const eased = progress * progress * (3 - 2 * progress);

            const startPosition = vectorFromArray(start.position);
            const endPosition = vectorFromArray(end.position);

            return startPosition.lerp(endPosition, eased);
        }
    }

    return vectorFromArray(
        milestones[milestones.length - 1].position
    );
}

/* =========================================
   HISTORICAL TRACK
========================================= */

function createHistoricalTrack() {
    const points = [];

    for (let year = START_YEAR; year <= END_YEAR; year += 0.15) {
        points.push(getHistoricalPosition(year));
    }

    points.push(getHistoricalPosition(END_YEAR));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
        color: 0x68e0f7,
        transparent: true,
        opacity: 0.8
    });

    scene.add(new THREE.Line(geometry, material));
}

/* =========================================
   CLEAR SELECTED PATH
========================================= */

function clearSelectedPath() {
    stopPathAnimation();

    if (selectedPathLine) {
        scene.remove(selectedPathLine);
        selectedPathLine.geometry.dispose();
        selectedPathLine.material.dispose();
        selectedPathLine = null;
    }

    selectedPath = null;
    pathPoints = [];

    document.querySelectorAll(".path-card").forEach((card) => {
        card.classList.remove("active");
        card.setAttribute("aria-pressed", "false");
    });

    const selectedInfo = document.getElementById("selectedPathInfo");

    if (selectedInfo) {
        selectedInfo.hidden = true;
    }
}

/* =========================================
   UPDATE TIMELINE
========================================= */

function updateTimeline(year) {
    const selectedYear = THREE.MathUtils.clamp(
        Number(year),
        START_YEAR,
        END_YEAR
    );

    clearSelectedPath();

    slider.value = String(selectedYear);
    yearDisplay.textContent = String(Math.floor(selectedYear));

    spacecraft.position.copy(getHistoricalPosition(selectedYear));
    desiredCameraTarget.copy(spacecraft.position);

    let currentMilestone = milestones[0];

    for (const milestone of milestones) {
        if (milestone.year <= selectedYear) {
            currentMilestone = milestone;
        }
    }

    eventTitle.textContent = currentMilestone.name;
    eventDescription.textContent = currentMilestone.description;

    if (selectedYear < 1973.9) {
        missionStatus.textContent = "MISSION BEGINS";
    } else if (selectedYear < 1997) {
        missionStatus.textContent = "OUTBOUND JOURNEY";
    } else if (selectedYear < 2003) {
        missionStatus.textContent = "LIMITED CONTACT";
    } else {
        missionStatus.textContent = "LAST SIGNAL RECEIVED";
        eventTitle.textContent = "Last Signal";
        eventDescription.textContent =
            "The final signal from Pioneer 10 was received in 2003. Its future paths are shown below as illustrative visualizations.";
    }

    /*
       The possible-path cards stay visible below the map.
       They are no longer hidden until the timeline reaches 2003.
    */
}

/* =========================================
   DRAW A SELECTED PATH
========================================= */

function showPossiblePath(pathKey) {
    const path = possiblePaths[pathKey];

    if (!path || !spacecraft || !scene) {
        return;
    }

    stopPlayback();
    clearSelectedPath();

    selectedPath = pathKey;

    const start = getHistoricalPosition(END_YEAR);
    spacecraft.position.copy(start);

    const direction = path.direction.clone().normalize();
    const points = [];
    const pointCount = 180;

    for (let i = 0; i <= pointCount; i++) {
        const t = i / pointCount;

        const point = start.clone().add(
            direction.clone().multiplyScalar(path.distance * t)
        );

        point.y += Math.sin(t * Math.PI) * path.bend;
        point.z += Math.sin(t * Math.PI * 2) * path.bend * 0.3;

        points.push(point);
    }

    pathPoints = points;

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineDashedMaterial({
        color: path.color,
        dashSize: 0.42,
        gapSize: 0.18,
        transparent: true,
        opacity: 0.95
    });

    selectedPathLine = new THREE.Line(geometry, material);
    selectedPathLine.computeLineDistances();
    scene.add(selectedPathLine);

    document.querySelectorAll(".path-card").forEach((card) => {
        const isSelected = card.dataset.path === pathKey;

        card.classList.toggle("active", isSelected);
        card.setAttribute("aria-pressed", String(isSelected));
    });

    document.getElementById("selectedPathTitle").textContent = path.title;

    document.getElementById("selectedPathDescription").textContent =
        path.description;

    document.getElementById("selectedPathInfo").hidden = false;

    animateSelectedPath();
}

/* =========================================
   ANIMATE SELECTED PATH
========================================= */

function animateSelectedPath() {
    stopPathAnimation();

    if (!pathPoints.length) {
        return;
    }

    let progress = 0;

    spacecraft.position.copy(pathPoints[0]);
    desiredCameraTarget.copy(spacecraft.position);

    pathAnimationTimer = window.setInterval(() => {
        progress += 0.007;

        if (progress >= 1) {
            progress = 1;
            stopPathAnimation();
        }

        const index = Math.min(
            Math.floor(progress * (pathPoints.length - 1)),
            pathPoints.length - 1
        );

        spacecraft.position.copy(pathPoints[index]);
        desiredCameraTarget.copy(spacecraft.position);
    }, 30);
}

function stopPathAnimation() {
    if (pathAnimationTimer !== null) {
        window.clearInterval(pathAnimationTimer);
        pathAnimationTimer = null;
    }
}

/* =========================================
   PATH OPTION CONTROLS
========================================= */

function setupPathOptions() {
    document.querySelectorAll(".path-card").forEach((card) => {
        card.addEventListener("click", () => {
            showPossiblePath(card.dataset.path);
        });
    });

    document.getElementById("replayPathButton").addEventListener("click", () => {
        if (selectedPath) {
            showPossiblePath(selectedPath);
        }
    });

    document.getElementById("clearPathButton").addEventListener("click", () => {
        clearSelectedPath();
        updateTimeline(Number(slider.value));
    });
}

/* =========================================
   CAMERA
========================================= */

function updateCamera(immediate = false) {
    const target = immediate
        ? desiredCameraTarget
        : cameraTarget;

    const horizontalDistance = cameraDistance * Math.cos(cameraPitch);

    const offset = new THREE.Vector3(
        Math.sin(cameraYaw) * horizontalDistance,
        Math.sin(cameraPitch) * cameraDistance,
        Math.cos(cameraYaw) * horizontalDistance
    );

    const desiredPosition = target.clone().add(offset);

    if (immediate) {
        camera.position.copy(desiredPosition);
        camera.lookAt(target);
        return;
    }

    camera.position.lerp(desiredPosition, 0.12);
    camera.lookAt(target);
}

/* =========================================
   TIMELINE PLAYBACK
========================================= */

function startPlayback() {
    if (isPlaying) {
        return;
    }

    if (Number(slider.value) >= END_YEAR) {
        updateTimeline(START_YEAR);
    }

    isPlaying = true;
    playButton.textContent = "❚❚ Pause";

    playTimer = window.setInterval(() => {
        const currentYear = Number(slider.value);
        const nextYear = Math.min(currentYear + 0.1, END_YEAR);

        updateTimeline(nextYear);

        if (nextYear >= END_YEAR) {
            stopPlayback();
        }
    }, 50);
}

function stopPlayback() {
    isPlaying = false;

    if (playTimer !== null) {
        window.clearInterval(playTimer);
        playTimer = null;
    }

    if (playButton) {
        playButton.textContent = "▶ Play";
    }
}

/* =========================================
   INTERACTIVE CONTROLS
========================================= */

function setupControls() {
    slider.addEventListener("input", () => {
        stopPlayback();
        updateTimeline(Number(slider.value));
    });

    playButton.addEventListener("click", () => {
        if (isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    });

    document.getElementById("resetButton").addEventListener("click", () => {
        stopPlayback();
        clearSelectedPath();

        cameraDistance = DEFAULT_ZOOM;
        cameraYaw = 0.45;
        cameraPitch = 0.5;

        updateTimeline(START_YEAR);

        cameraTarget.copy(spacecraft.position);
        desiredCameraTarget.copy(spacecraft.position);

        updateCamera(true);
    });

    document.getElementById("zoomInButton").addEventListener("click", () => {
        cameraDistance = Math.max(MIN_ZOOM, cameraDistance - 2);
    });

    document.getElementById("zoomOutButton").addEventListener("click", () => {
        cameraDistance = Math.min(MAX_ZOOM, cameraDistance + 2);
    });

    document.getElementById("zoomResetButton").addEventListener("click", () => {
        cameraDistance = DEFAULT_ZOOM;
        cameraYaw = 0.45;
        cameraPitch = 0.5;
    });

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    renderer.domElement.addEventListener(
        "wheel",
        (event) => {
            event.preventDefault();

            cameraDistance = THREE.MathUtils.clamp(
                cameraDistance + event.deltaY * 0.015,
                MIN_ZOOM,
                MAX_ZOOM
            );
        },
        { passive: false }
    );

    setupPathOptions();
}

function onPointerDown(event) {
    isDragging = true;

    previousPointerX = event.clientX;
    previousPointerY = event.clientY;

    if (renderer.domElement.setPointerCapture) {
        renderer.domElement.setPointerCapture(event.pointerId);
    }
}

function onPointerMove(event) {
    if (!isDragging) {
        return;
    }

    const deltaX = event.clientX - previousPointerX;
    const deltaY = event.clientY - previousPointerY;

    previousPointerX = event.clientX;
    previousPointerY = event.clientY;

    cameraYaw -= deltaX * 0.005;

    cameraPitch = THREE.MathUtils.clamp(
        cameraPitch + deltaY * 0.005,
        -1.1,
        1.1
    );
}

function onPointerUp() {
    isDragging = false;
}

/* =========================================
   RESIZE
========================================= */

function onWindowResize() {
    if (!renderer || !camera || !container) {
        return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width <= 0 || height <= 0) {
        return;
    }

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

/* =========================================
   ANIMATION LOOP
========================================= */

function animate() {
    const delta = Math.min(clock.getDelta(), 0.05);

    planetObjects.forEach((planet) => {
        const data = planet.userData;

        data.angle += data.speed * delta * 0.25;

        planet.position.x = Math.cos(data.angle) * data.distance;
        planet.position.z = Math.sin(data.angle) * data.distance;

        planet.rotation.y += delta * 0.12;
    });

    if (stars) {
        stars.rotation.y += delta * 0.002;
    }

    if (spacecraft) {
        spacecraft.rotation.y += delta * 0.12;
    }

    cameraTarget.lerp(desiredCameraTarget, 0.12);

    updateCamera();

    renderer.render(scene, camera);
}

/* =========================================
   START APPLICATION
========================================= */

init();
