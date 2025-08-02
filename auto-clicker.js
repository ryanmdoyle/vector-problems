// ==UserScript==
// @name         Vector Problems
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Automatically clicks buttons found on any page to advance through training
// @author       You
// @match        https://rocklinacademy-chartersafejpa.safeschools.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Array of button selectors - now organized by button type for better understanding
    const buttonSelectors = [
        // Start buttons - found on course listing pages
        'a.btn.btn-default.btn-block[aria-label*="Start Bloodborne Pathogen"]',
        'a.btn.btn-default.btn-block[href*="course_version"][aria-label*="Start"]',
        'a.btn[aria-label*="Start"][href*="training/launch/course_version"]',

        // Accept/Disclaimer buttons - found on terms/disclaimer pages
        'a.btn.btn-tertiary-dark[href*="disclaimer/accept"]',
        'a.btn[href*="disclaimer/accept"]',
        'a[role="button"][href*="disclaimer/accept"]',

        // Course launch buttons - found on course introduction pages
        'a.icon-ring[href*="training/player"][href*="continue_course=1"]',
        'a.icon-ring.white',
        'div.launch-course-btn a.icon-ring',
        '#course_start_btn_text a',

        // Video control buttons - found on training video pages
        'button.slip_control[data-trigger="play"]',
        'button.slip_control[aria-labelledby="play-toggle-tip"]',
        'button[data-trigger="play"]',
        'button.slip_control .slip-play',
        '.slip_left_controls button.slip_control:first-child',
        '#player-controls button.slip_control:first-child',

        // Vimeo player controls - found on Vimeo-hosted videos
        'button[data-play-button="true"]',
        '.PlayButton_module_playButton__d1afd73a',
        '.PlayButton_module_playButtonWrapper__d1afd73a button',
        'button[aria-labelledby="play-button-tooltip"]',
        '.vp-controls button[data-play-button]',

        // Skip buttons - found on video/training pages
        '.slip_message.skip_button button',
        'div.skip_button button',
        '.slip_message_container button',
        '.slip_message button',

        // Skip buttons - found on video/training pages
        '.slip_message.skip_button button',
        'div.skip_button button',
        '.slip_message button:has(.slip-arrow-right)',
        '.slip_message_container button',

        // General navigation buttons - add more as needed
        'button.next_section',
        'button[onclick*="return_to_next_item"]',
        'button.btn .fa-chevron-right',
        'button.next-button',
        'input[type="submit"][value="Continue"]',
        'a.btn[href*="next"]',
        'button[aria-label*="Continue"]',
        'button[onclick*="next"]',
        'button.btn-secondary'
    ];

    const blacklistSelectors = [
        'button.slip_control[data-trigger="seek_next_lo"]',
        'button[data-trigger="seek_next_lo"]',
        'button[data-trigger="seek_prev_lo"]',
    ];

    // Track which buttons we've already clicked on this page to prevent infinite loops
    let clickedButtons = new Set();
    let searchAttempts = 0;
    const maxSearchAttempts = 5; // Maximum attempts before giving up on current page

    /**
     * Searches through all button selectors and finds the first clickable button
     * Returns an object with the button element and the selector that found it
     */
    function findClickableButton() {
        console.log('Auto-clicker: Searching for clickable buttons...');

        // Check each selector to find a visible, clickable button
        for (const selector of buttonSelectors) {
            const button = document.querySelector(selector);

            // Check if button exists, is visible, and hasn't been clicked yet
            if (button &&
                button.offsetParent !== null &&
                !clickedButtons.has(selector) &&
                !blacklistSelectors.some(bSelector => button.matches(bSelector))) {

                // Special check for video buttons - don't click if video is already playing
                if (isVideoPlayButton(selector)) {
                    if (isVideoCurrentlyPlaying(button)) {
                        console.log(`Auto-clicker: Video is already playing, skipping button with selector: ${selector}`);
                        continue; // Skip this button and check next selector
                    }

                    /**
     * Clicks on the video area at specific coordinates to trigger play
     */
                    function clickOnVideoArea() {
                        // Look for various video container elements
                        const videoSelectors = [
                            '#player',
                            '.player',
                            '.vp-video-wrapper',
                            '.vp-video',
                            '.vp-telecine',
                            'video',
                            '.video-container',
                            '.video-player',
                            '[data-player]'
                        ];

                        let videoElement = null;

                        // Find the first visible video container
                        for (const selector of videoSelectors) {
                            const element = document.querySelector(selector);
                            if (element && element.offsetParent !== null) {
                                videoElement = element;
                                console.log(`Auto-clicker: Found video container with selector: ${selector}`);
                                break;
                            }
                        }

                        if (!videoElement) {
                            console.log('Auto-clicker: No video container found for coordinate clicking');
                            return;
                        }

                        // Get the bounding rectangle of the video element
                        const rect = videoElement.getBoundingClientRect();

                        // Calculate click coordinates (25px from bottom-left)
                        const clickX = rect.left + 25;
                        const clickY = rect.bottom - 25;

                        console.log('Auto-clicker: Clicking on video area at coordinates:', {
                            x: clickX,
                            y: clickY,
                            elementRect: rect,
                            element: videoElement
                        });

                        // Create and dispatch mouse events at the calculated coordinates
                        const mouseDownEvent = new MouseEvent('mousedown', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: clickX,
                            clientY: clickY,
                            button: 0
                        });

                        const mouseUpEvent = new MouseEvent('mouseup', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: clickX,
                            clientY: clickY,
                            button: 0
                        });

                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: clickX,
                            clientY: clickY,
                            button: 0,
                            detail: 1
                        });

                        // Dispatch the events in sequence
                        videoElement.dispatchEvent(mouseDownEvent);
                        setTimeout(() => {
                            videoElement.dispatchEvent(mouseUpEvent);
                            setTimeout(() => {
                                videoElement.dispatchEvent(clickEvent);
                                console.log('Auto-clicker: Coordinate-based click completed');
                            }, 50);
                        }, 50);

                        // Also try clicking on any child elements at those coordinates
                        const elementAtPoint = document.elementFromPoint(clickX, clickY);
                        if (elementAtPoint && elementAtPoint !== videoElement) {
                            console.log('Auto-clicker: Also clicking element found at coordinates:', elementAtPoint);
                            setTimeout(() => {
                                elementAtPoint.click();
                            }, 200);
                        }
                    }
                }

                console.log(`Auto-clicker: Found clickable button with selector: ${selector}`);
                console.log('Auto-clicker: Button element:', button);
                return { element: button, selector: selector };
            }
        }

        // If no direct selectors matched, try text-based matching
        const textBasedButton = findButtonByText();
        if (textBasedButton) {
            return textBasedButton;
        }

        return null; // No clickable button found
    }

    /**
     * Finds buttons by their text content when CSS selectors aren't sufficient
     */
    function findButtonByText() {
        const textPatterns = [
            'Skip',
            'Next Section',
            'Next',
            'Continue',
            'Start',
            'Accept',
            'Begin'
        ];

        // Look for buttons containing specific text
        const allButtons = document.querySelectorAll('button, a.btn, input[type="submit"]');

        for (const button of allButtons) {
            if (button.offsetParent === null) continue; // Skip hidden buttons

            if (blacklistSelectors.some(b => button.matches(b))) {
                console.log(`Auto-clicker: Skipping blacklisted text-based button: ${button.outerHTML}`);
                continue;
            }

            const buttonText = button.textContent?.trim() || '';
            const textSelector = `text-match-${buttonText.replace(/\s+/g, '-').toLowerCase()}`;

            if (clickedButtons.has(textSelector)) continue; // Skip already clicked

            // Check if button text matches any of our patterns
            for (const pattern of textPatterns) {
                if (buttonText.toLowerCase().includes(pattern.toLowerCase())) {
                    console.log(`Auto-clicker: Found button by text content: "${buttonText}"`);
                    return {
                        element: button,
                        selector: textSelector
                    };
                }
            }
        }

        return null;
    }

    /**
     * Clicks a button using the most appropriate method based on button type
     */
    function clickButton(buttonData) {
        const { element: button, selector } = buttonData;

        console.log(`Auto-clicker: Preparing to click button with selector: ${selector}`);

        // Scroll button into view for better user experience
        button.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Mark this button as clicked to prevent re-clicking
        clickedButtons.add(selector);

        // Add a small delay to ensure page is ready and scrolling is complete
        setTimeout(() => {
            try {
                console.log(`Auto-clicker: Clicking button with selector: ${selector}`);

                // Special handling for video play buttons
                if (isVideoPlayButton(selector)) {
                    handleVideoPlayButton(button, selector);
                } else {
                    // Standard button click handling
                    handleStandardButton(button, selector);
                }

                console.log(`Auto-clicker: Successfully clicked button with selector: ${selector}`);

                // Wait before searching for next button (longer for video buttons)
                const waitTime = isVideoPlayButton(selector) ? 8000 : 5000;
                setTimeout(() => {
                    // Reset search attempts since we successfully clicked something
                    searchAttempts = 0;
                    searchForButtons();
                }, waitTime);

            } catch (error) {
                console.error('Auto-clicker: Error clicking button:', error);
                // Continue searching even if click failed
                setTimeout(searchForButtons, 3000);
            }
        }, 1000);
    }

    /**
     * Determines if a selector is for a video play button
     */
    function isVideoPlayButton(selector) {
        return selector.includes('slip_control') ||
            selector.includes('data-trigger="play"') ||
            selector.includes('player-controls') ||
            selector.includes('data-play-button') ||
            selector.includes('PlayButton_module') ||
            selector.includes('vp-controls');
    }

    /**
     * Checks if a video is currently playing by examining the button state
     */
    function isVideoCurrentlyPlaying(button) {
        // Method 1: Check data-trigger attribute (for slip controls)
        const dataTrigger = button.getAttribute('data-trigger');
        if (dataTrigger === 'pause') {
            console.log('Auto-clicker: Video is playing (data-trigger="pause" detected)');
            return true;
        }

        // Method 2: Check for Vimeo player state
        if (button.hasAttribute('data-play-button')) {
            // Look for pause icon in Vimeo player
            const pauseIcon = button.querySelector('[data-pause-icon="true"]');
            if (pauseIcon) {
                console.log('Auto-clicker: Video is playing (Vimeo pause icon detected)');
                return true;
            }

            // Check if play icon is hidden (might indicate playing state)
            const playIcon = button.querySelector('[data-play-icon="true"]');
            if (playIcon && window.getComputedStyle(playIcon).display === 'none') {
                console.log('Auto-clicker: Video might be playing (Vimeo play icon hidden)');
                return true;
            }
        }

        // Method 3: Check for pause icon (absence of play icon)
        const playIcon = button.querySelector('.slip-play') || button.querySelector('.slip.slip-play');
        const pauseIcon = button.querySelector('.slip-pause') || button.querySelector('.slip.slip-pause');

        if (pauseIcon) {
            console.log('Auto-clicker: Video is playing (pause icon detected)');
            return true;
        }

        // Method 4: If play icon is hidden/not visible, video might be playing
        if (playIcon && window.getComputedStyle(playIcon).display === 'none') {
            console.log('Auto-clicker: Video might be playing (play icon is hidden)');
            return true;
        }

        // Method 5: Check button aria-label or title for play/pause state
        const ariaLabel = button.getAttribute('aria-label') || '';
        const title = button.getAttribute('title') || '';
        const ariaLabelledBy = button.getAttribute('aria-labelledby');

        if (ariaLabel.toLowerCase().includes('pause') || title.toLowerCase().includes('pause')) {
            console.log('Auto-clicker: Video is playing (pause detected in aria-label or title)');
            return true;
        }

        // Check the aria-labelledby target element
        if (ariaLabelledBy) {
            const labelElement = document.getElementById(ariaLabelledBy);
            if (labelElement && labelElement.textContent.toLowerCase().includes('pause')) {
                console.log('Auto-clicker: Video is playing (pause detected in aria-labelledby target)');
                return true;
            }
        }

        console.log('Auto-clicker: Video appears to be paused/stopped', {
            dataTrigger: dataTrigger,
            hasPlayIcon: !!playIcon,
            hasPauseIcon: !!pauseIcon,
            playIconVisible: playIcon ? window.getComputedStyle(playIcon).display !== 'none' : false,
            isVimeoButton: button.hasAttribute('data-play-button')
        });

        return false; // Video is not playing
    }

    /**
     * Handles clicking video play buttons with enhanced methods
     */
    function handleVideoPlayButton(button, selector) {
        console.log('Auto-clicker: Detected video play button, using enhanced click method');
        console.log('Auto-clicker: Button details:', {
            classes: button.className,
            dataTrigger: button.dataset.trigger,
            ariaLabel: button.getAttribute('aria-labelledby'),
            hasPlayIcon: !!button.querySelector('.slip-play'),
            hasPauseIcon: !!button.querySelector('.slip-pause')
        });

        // Double-check that video isn't playing before clicking
        if (isVideoCurrentlyPlaying(button)) {
            console.log('Auto-clicker: Aborting click - video is already playing');
            return;
        }

        // Try regular click first
        button.click();

        // Video buttons sometimes need extra help, so try alternative methods
        setTimeout(() => {
            // Check if video started playing
            if (!isVideoCurrentlyPlaying(button)) {
                console.log('Auto-clicker: Video still appears paused after click, trying alternative methods');

                // Find the play icon
                const playIcon = button.querySelector('.slip-play') || button.querySelector('.slip.slip-play');

                // Method 1: Try clicking the play icon directly
                if (playIcon) {
                    console.log('Auto-clicker: Trying to click play icon directly');
                    playIcon.click();
                }

                // Method 2: Dispatch mouse event on button
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    detail: 1
                });
                button.dispatchEvent(clickEvent);

                // Method 3: Try focus + enter key
                setTimeout(() => {
                    if (!isVideoCurrentlyPlaying(button)) {
                        console.log('Auto-clicker: Trying keyboard methods');
                        button.focus();

                        // Try Enter key
                        const enterEvent = new KeyboardEvent('keydown', {
                            bubbles: true,
                            cancelable: true,
                            key: 'Enter',
                            code: 'Enter'
                        });
                        button.dispatchEvent(enterEvent);

                        // Also try spacebar (common for play buttons)
                        setTimeout(() => {
                            const spaceEvent = new KeyboardEvent('keydown', {
                                bubbles: true,
                                cancelable: true,
                                key: ' ',
                                code: 'Space'
                            });
                            button.dispatchEvent(spaceEvent);
                        }, 200);

                        // Try the 'k' key since tooltip mentions it
                        setTimeout(() => {
                            const kEvent = new KeyboardEvent('keydown', {
                                bubbles: true,
                                cancelable: true,
                                key: 'k',
                                code: 'KeyK'
                            });
                            document.dispatchEvent(kEvent);
                        }, 400);
                    }
                }, 500);
            } else {
                console.log('Auto-clicker: Video successfully started playing');
            }
        }, 1500);
    }

    /**
     * Handles clicking standard navigation buttons
     */
    function handleStandardButton(button, selector) {
        // Click the button
        button.click();

        // If it's a link, also try direct navigation as backup
        if (button.href && button.href !== window.location.href) {
            console.log(`Auto-clicker: Also navigating to: ${button.href}`);
            setTimeout(() => {
                window.location.href = button.href;
            }, 500);
        }
    }

    /**
     * Main search function that looks for buttons and clicks them
     */
    function searchForButtons() {
        searchAttempts++;
        console.log(`Auto-clicker: Search attempt ${searchAttempts}/${maxSearchAttempts}`);
        console.log('Auto-clicker: Current URL:', window.location.href);

        const buttonData = findClickableButton();

        if (buttonData) {
            // Found a button to click
            clickButton(buttonData);
        } else {
            // No button found
            console.log('Auto-clicker: No clickable buttons found');

            // Debug information to help troubleshoot
            logDebugInfo();

            if (searchAttempts < maxSearchAttempts) {
                // Keep searching
                console.log('Auto-clicker: Continuing search...');
                setTimeout(searchForButtons, 3000);
            } else {
                // Finished this search cycle
                console.log('Auto-clicker: Max search attempts reached for this cycle');
                searchAttempts = 0; // Reset for next cycle
                // Note: The continuous search will restart this cycle in 1 minute
            }
        }
    }

    /**
     * Starts a continuous search cycle that runs every minute
     */
    function startContinuousSearch() {
        console.log('Auto-clicker: Starting continuous search - will run every 60 seconds');

        // Run the first search cycle immediately
        searchForButtons();

        // Set up interval to run search cycles every minute
        const searchInterval = setInterval(() => {
            console.log('Auto-clicker: Starting new search cycle (60-second interval)');
            searchAttempts = 0; // Reset attempts for new cycle
            clickedButtons.clear(); // Clear clicked buttons to allow re-clicking if needed
            searchForButtons();
        }, 60000); // 60 seconds = 60000 milliseconds

        // Store interval ID for cleanup
        window.autoClickerSearchInterval = searchInterval;

        return searchInterval;
    }

    /**
     * Logs debug information to help identify available buttons
     */
    function logDebugInfo() {
        console.log('Auto-clicker: Debug - Looking for potential buttons...');

        // Log some common button patterns that might be on the page
        const potentialButtons = document.querySelectorAll(
            'a[aria-label*="Start"], a[href*="training"], a.btn, button[data-trigger], button.slip_control'
        );

        if (potentialButtons.length > 0) {
            console.log('Auto-clicker: Found potential buttons:', potentialButtons);
            potentialButtons.forEach((btn, index) => {
                console.log(`  Button ${index}:`, {
                    element: btn,
                    visible: btn.offsetParent !== null,
                    text: btn.textContent?.trim(),
                    href: btn.href,
                    classes: btn.className
                });
            });
        }
    }


    /**
     * Initializes the script when page is ready
     */
    function initializeScript() {
        console.log('Auto-clicker: Script initialized on page:', window.location.href);
        console.log('Auto-clicker: Document ready state:', document.readyState);

        // Clear any existing search interval
        if (window.autoClickerSearchInterval) {
            clearInterval(window.autoClickerSearchInterval);
        }

        // Clear the clicked buttons set for new page
        clickedButtons.clear();
        searchAttempts = 0;

        // Start continuous search cycle
        startContinuousSearch();

        // Try to play vimeo
        function loadVimeoScript(callback) {
            if (typeof Vimeo !== 'undefined') {
                callback(); // Already loaded
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://player.vimeo.com/api/player.js';
            script.onload = callback;
            document.head.appendChild(script);
        }

        function tryPlayVimeo() {
            const iframe = document.querySelector('#player iframe');
            if (!iframe) {
                console.log('Auto-clicker: Vimeo iframe not found yet.');
                return;
            }

            const player = new Vimeo.Player(iframe);

            player.getPaused().then(function(paused) {
                if (paused) {
                    player.play().then(function() {
                        console.log('Auto-clicker: Vimeo video started playing.');
                    }).catch(function(error) {
                        console.warn('Auto-clicker: Error starting Vimeo video:', error);
                    });
                } else {
                    console.log('Auto-clicker: Vimeo video is already playing.');
                }
            });
        }

        setTimeout(() => {
            loadVimeoScript(tryPlayVimeo);
        }, 3000);

    }

    // Initialize when page is ready
    if (document.readyState === 'loading') {
        console.log('Auto-clicker: Waiting for page to load...');
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeScript, 2000);
        });
    } else {
        console.log('Auto-clicker: Page already loaded, starting...');
        setTimeout(initializeScript, 2000);
    }

    // Handle page navigation - restart when URL changes
    let currentUrl = window.location.href;
    const urlCheckInterval = setInterval(() => {
        if (window.location.href !== currentUrl) {
            const oldUrl = currentUrl;
            currentUrl = window.location.href;
            console.log(`Auto-clicker: Page changed from ${oldUrl} to ${currentUrl}`);

            // Reinitialize for the new page
            setTimeout(initializeScript, 2000);
        }
    }, 1000);

    // Cleanup function (though userscripts don't typically need this)
    window.addEventListener('beforeunload', () => {
        clearInterval(urlCheckInterval);
        if (window.autoClickerSearchInterval) {
            clearInterval(window.autoClickerSearchInterval);
        }
    });

})();
