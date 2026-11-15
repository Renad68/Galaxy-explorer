
const artifactData = {
    voyager1: {
        name: "Voyager 1",
        image: "image/voyager1.png",
        launchDate: "September 5, 1977",
        mission:
            "Voyager 1 was launched to study Jupiter and Saturn. Its mission later continued into interstellar space.",
        achievement:
            "It entered interstellar space in August 2012 and is the most distant human-made spacecraft.",
        status:
            "Active mission. NASA continues communicating with Voyager 1, although its aging systems and limited power restrict operations.",
        source:
            "https://science.nasa.gov/mission/voyager/voyager-1/",
        imageSource:
            "https://science.nasa.gov/mission/voyager/spacecraft/",
        credit: "NASA / JPL-Caltech"
    },

    voyager2: {
        name: "Voyager 2",
        image: "image/voyager2.png",
        launchDate: "August 20, 1977",
        mission:
            "Voyager 2 explored Jupiter, Saturn, Uranus, and Neptune before continuing toward interstellar space.",
        achievement:
            "It is the only spacecraft to have visited Uranus and Neptune up close. It entered interstellar space in 2018.",
        status:
            "Active extended mission. NASA continues communicating with Voyager 2 while managing its declining power supply.",
        source:
            "https://science.nasa.gov/mission/voyager/voyager-2/",
        imageSource:
            "https://science.nasa.gov/mission/voyager/spacecraft/",
        credit: "NASA / JPL-Caltech"
    },

    tesla: {
        name: "Tesla Roadster",
        image: "image/tesla roadster.png",
        launchDate: "February 6, 2018",
        mission:
            "The Tesla Roadster was a demonstration payload aboard the first Falcon Heavy rocket flight. It was sent into an orbit around the Sun.",
        achievement:
            "The electric car carried a mannequin nicknamed Starman and became an artificial object orbiting the Sun.",
        status:
            "No active communication with the car is documented. It was not designed as a scientific spacecraft.",
        source:
            "https://www.nasa.gov/history/5-years-ago-first-flight-of-the-falcon-heavy-rocket/",
        imageSource:
            "https://www.nasa.gov/history/5-years-ago-first-flight-of-the-falcon-heavy-rocket/",
        credit: "SpaceX / NASA historical article"
    },

    pioneer10: {
        name: "Pioneer 10",
        image: "image/pioneer10.png",
        launchDate: "March 2, 1972",
        mission:
            "Pioneer 10 was designed to investigate Jupiter and study conditions in the outer Solar System.",
        achievement:
            "It was the first spacecraft to make close-up observations of Jupiter and provided important information about the planet.",
        status:
            "No contact. NASA received Pioneer 10's last signal on January 23, 2003. A later attempt to contact it in 2006 was unsuccessful.",
        source:
            "https://science.nasa.gov/mission/pioneer-10/",
        imageSource:
            "https://science.nasa.gov/mission/pioneer-10/",
        credit: "NASA"
    }
};

const artifactGrid = document.getElementById("artifactGrid");
const artifactModal = document.getElementById("artifactModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

function openArtifact(id) {
    const artifact = artifactData[id];

    if (!artifact || !artifactModal || !modalBody) return;

    modalBody.replaceChildren();

    const imageContainer = document.createElement("div");
    imageContainer.className = "modal-img";

    const image = document.createElement("img");
    image.src = artifact.image;
    image.alt = artifact.name;
    image.loading = "lazy";

    image.addEventListener("error", function () {
        image.style.display = "none";

        if (!imageContainer.querySelector(".image-error")) {
            const errorMessage = document.createElement("p");
            errorMessage.className = "image-error";
            errorMessage.textContent =
                "Image not found. Check the image folder and filename.";
            imageContainer.prepend(errorMessage);
        }
    });

    imageContainer.appendChild(image);

    const imageCredit = document.createElement("p");
    imageCredit.className = "image-credit";
    imageCredit.append("Image credit: " + artifact.credit);

    const imageLink = document.createElement("a");
    imageLink.href = artifact.imageSource;
    imageLink.target = "_blank";
    imageLink.rel = "noopener noreferrer";
    imageLink.textContent = "Image / reference source ↗";

    imageCredit.appendChild(document.createElement("br"));
    imageCredit.appendChild(imageLink);
    imageContainer.appendChild(imageCredit);

    const textContainer = document.createElement("div");
    textContainer.className = "modal-text";

    const tag = document.createElement("span");
    tag.className = "artifact-tag";
    tag.textContent = "SPACE MUSEUM ARCHIVE";

    const title = document.createElement("h2");
    title.id = "modalTitle";
    title.textContent = artifact.name;

    textContainer.append(tag, title);

    const details = [
        ["Launch Date", artifact.launchDate],
        ["Mission Objective", artifact.mission],
        ["Major Achievement", artifact.achievement],
        ["Communication Status", artifact.status]
    ];

    details.forEach(function ([heading, content]) {
        const paragraph = document.createElement("p");
        const strong = document.createElement("strong");

        strong.textContent = heading;
        paragraph.append(strong, document.createElement("br"), content);
        textContainer.appendChild(paragraph);
    });

    const sourceParagraph = document.createElement("p");
    sourceParagraph.className = "source-link";

    const sourceHeading = document.createElement("strong");
    sourceHeading.textContent = "Mission Source";

    const sourceLink = document.createElement("a");
    sourceLink.href = artifact.source;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    sourceLink.textContent = "Open official reference ↗";

    sourceParagraph.append(
        sourceHeading,
        document.createElement("br"),
        sourceLink
    );

    textContainer.appendChild(sourceParagraph);
    modalBody.append(imageContainer, textContainer);

    artifactModal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function hideModal() {
    if (!artifactModal) return;

    artifactModal.classList.remove("active");
    document.body.style.overflow = "";
}

if (artifactGrid) {
    artifactGrid.addEventListener("click", function (event) {
        const card = event.target.closest(".artifact-card");

        if (!card || !artifactGrid.contains(card)) return;

        openArtifact(card.dataset.id);
    });
}

if (closeModal) {
    closeModal.addEventListener("click", hideModal);
}

if (artifactModal) {
    artifactModal.addEventListener("click", function (event) {
        if (event.target === artifactModal) {
            hideModal();
        }
    });
}

document.addEventListener("keydown", function (event) {
    if (
        event.key === "Escape" &&
        artifactModal?.classList.contains("active")
    ) {
        hideModal();
    }
});
