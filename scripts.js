document.addEventListener("DOMContentLoaded", function() {
    const loadMedia = (url, containerId) => {
      fetch(url)
        .then(response => response.json())
        .then(data => {
          const mediaContainer = document.getElementById(containerId);
          const carouselList = document.createElement('ul');
          carouselList.classList.add('carousel__list');
          data.forEach((media) => {
            const mediaElement = document.createElement('li');
            mediaElement.className = 'carousel__item';
            if (media.type === 'image') {
              mediaElement.innerHTML = `<img src="${media.url}" alt="${media.title}" style="cursor: pointer;">`;
            } else if (media.type === 'video') {
              mediaElement.innerHTML = `
                <div class="video-container" style="position: relative;">
                  <video style="cursor: pointer;" muted>
                    <source src="${media.url}" type="video/mp4">Your browser does not support the video tag.
                  </video>
                  <div class="play-button">&#9658;</div>
                </div>
              `;
            }
            carouselList.appendChild(mediaElement);
          });
          mediaContainer.appendChild(carouselList);
          setupCarouselNavigation(mediaContainer, data.length);
          setupFullScreenView();
        })
        .catch(error => console.error('Error fetching media:', error));
    };
  
    loadMedia('newspaper.json', 'newspaper-carousel');
    loadMedia('infographics.json', 'infographics-carousel'); // Add this line for infographics
    loadMedia('video.json', 'video-carousel');
  });

  const setupCarouselNavigation = (carouselContainer, totalItems) => {
    const prevButton = carouselContainer.parentElement.querySelector('.left-arrow');
    const nextButton = carouselContainer.parentElement.querySelector('.right-arrow');
    const carouselList = carouselContainer.querySelector('.carousel__list');
    const items = carouselList.querySelectorAll('.carousel__item');
    let currentIndex = 0;

    prevButton.addEventListener('click', function() {
      currentIndex = (currentIndex - 1 + totalItems) % totalItems;
      updateCarousel();
    });

    nextButton.addEventListener('click', function() {
      currentIndex = (currentIndex + 1) % totalItems;
      updateCarousel();
    });

    const updateCarousel = () => {
      const itemWidth = items[0].offsetWidth + 10; // Include margin
      const newPosition = -currentIndex * itemWidth;
      carouselList.style.transform = `translateX(${newPosition}px)`;
    };
  };

  const setupFullScreenView = () => {
    const overlay = document.getElementById('full-screen-overlay');
    const closeOverlay = document.getElementById('close-overlay');
    const fullScreenPrev = document.getElementById('full-screen-prev');
    const fullScreenNext = document.getElementById('full-screen-next');
    let mediaItems = [];
    let currentIndex = 0;

    const setupImageFullScreen = () => {
      document.querySelectorAll('.carousel__item img').forEach((img, index) => {
        img.addEventListener('click', function() {
          mediaItems = Array.from(document.querySelectorAll('.carousel__item img'));
          currentIndex = index;
          showFullScreenMedia(mediaItems[currentIndex].src, 'image');
        });
      });
    };

    const setupVideoFullScreen = () => {
      document.querySelectorAll('.carousel__item video').forEach((video, index) => {
        const playButton = video.parentElement.querySelector('.play-button');
        const triggerFullScreen = () => {
          mediaItems = Array.from(document.querySelectorAll('.carousel__item video'));
          currentIndex = index;
          showFullScreenMedia(mediaItems[currentIndex].querySelector('source').src, 'video');
        };
        playButton.addEventListener('click', triggerFullScreen);
        video.addEventListener('click', triggerFullScreen);
      });
    };

    const showFullScreenMedia = (src, type) => {
      overlay.innerHTML = `<span id="close-overlay">&times;</span>`;
      if (type === 'image') {
        const imgElement = document.createElement('img');
        imgElement.src = src;
        imgElement.alt = "Full Screen Image";
        overlay.appendChild(imgElement);
        imgElement.addEventListener('click', () => {
          imgElement.classList.toggle('zoomed');
          if (imgElement.classList.contains('zoomed')) {
            enablePanning(imgElement);
          } else {
            disablePanning(imgElement);
          }
        });
      } else if (type === 'video') {
        const videoElement = document.createElement('video');
        videoElement.controls = true;
        videoElement.autoplay = true;
        const sourceElement = document.createElement('source');
        sourceElement.src = src;
        sourceElement.type = "video/mp4";
        videoElement.appendChild(sourceElement);
        overlay.appendChild(videoElement);
      }
      overlay.style.display = 'flex';
      setupCloseOverlay();
    };

    const setupCloseOverlay = () => {
      document.getElementById('close-overlay').addEventListener('click', function() {
        overlay.style.display = 'none';
        overlay.innerHTML = `<span id="close-overlay">&times;</span>`;
      });
    };

    document.addEventListener('keydown', (event) => {
      if (overlay.style.display === 'flex') {
        if (event.key === 'ArrowLeft') {
          navigateFullScreenMedia(-1);
        } else if (event.key === 'ArrowRight') {
          navigateFullScreenMedia(1);
        }
      }
    });

    let touchstartX = 0;
    let touchendX = 0;

    overlay.addEventListener('touchstart', (event) => {
      touchstartX = event.changedTouches[0].screenX;
    });

    overlay.addEventListener('touchend', (event) => {
      touchendX = event.changedTouches[0].screenX;
      handleSwipeGesture();
    });

    const handleSwipeGesture = () => {
      if (touchendX < touchstartX - 50) {
        navigateFullScreenMedia(1);
      } else if (touchendX > touchstartX + 50) {
        navigateFullScreenMedia(-1);
      }
    };

    const navigateFullScreenMedia = (direction) => {
      currentIndex = (currentIndex + direction + mediaItems.length) % mediaItems.length;
      const mediaElement = mediaItems[currentIndex];
      if (mediaElement) {
        const mediaType = mediaElement.tagName.toLowerCase();
        const src = mediaType === 'img' ? mediaElement.src : mediaElement.querySelector('source').src;
        overlay.innerHTML = `<span id="close-overlay">&times;</span>`;
        if (mediaType === 'img') {
          const imgElement = document.createElement('img');
          imgElement.src = src;
          imgElement.alt = "Full Screen Image";
          overlay.appendChild(imgElement);
          imgElement.addEventListener('click', () => {
            imgElement.classList.toggle('zoomed');
            if (imgElement.classList.contains('zoomed')) {
              enablePanning(imgElement);
            } else {
              disablePanning(imgElement);
            }
          });
        } else if (mediaType === 'video') {
          const videoElement = document.createElement('video');
          videoElement.controls = true;
          videoElement.autoplay = true;
          const sourceElement = document.createElement('source');
          sourceElement.src = src;
          sourceElement.type = "video/mp4";
          videoElement.appendChild(sourceElement);
          overlay.appendChild(videoElement);
        }
        setupCloseOverlay();
      }
    };

    const enablePanning = (imgElement) => {
      let isPanning = false;
      let startX = 0;
      let startY = 0;
      let scrollLeft = 0;
      let scrollTop = 0;

      imgElement.addEventListener('mousedown', (e) => {
        isPanning = true;
        startX = e.pageX - imgElement.offsetLeft;
        startY = e.pageY - imgElement.offsetTop;
        scrollLeft = overlay.scrollLeft;
        scrollTop = overlay.scrollTop;
        imgElement.style.cursor = 'grabbing';
      });

      imgElement.addEventListener('mouseup', () => {
        isPanning = false;
        imgElement.style.cursor = 'grab';
      });

      imgElement.addEventListener('mouseleave', () => {
        isPanning = false;
        imgElement.style.cursor = 'grab';
      });

      imgElement.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();
        const x = e.pageX - imgElement.offsetLeft;
        const y = e.pageY - imgElement.offsetTop;
        const walkX = (x - startX) * 2; // Adjust scroll speed
        const walkY = (y - startY) * 2; // Adjust scroll speed
        overlay.scrollLeft = scrollLeft - walkX;
        overlay.scrollTop = scrollTop - walkY;
      });
    };

    const disablePanning = (imgElement) => {
      imgElement.style.cursor = 'zoom-out';
      imgElement.onmousedown = null;
      imgElement.onmousemove = null;
    };

    setupImageFullScreen();
    setupVideoFullScreen();
  };

  document.addEventListener("DOMContentLoaded", function() {
    const navToggle = document.querySelector(".nav-toggle");
    const navUl = document.querySelector("header nav ul");

    navToggle.addEventListener("click", function() {
      navUl.classList.toggle("showing");
    });
  });