

import { useState, useEffect, useRef } from 'react';
import { GrowingVines } from './GrowingVines';
import { vinylFactCache } from '~/lib/cache';

// FACTS SHOULD BE FETCHED FROM NEW AGENT
export function WelcomeHero() {
    const [vinylFact, setVinylFact] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const initRef = useRef(false);

    useEffect(() => {
        if (!initRef.current) {
            initRef.current = true;
            
            // Check cache first
            const cachedFact = vinylFactCache.get();
            if (cachedFact) {
                console.log('Using cached vinyl fact');
                setVinylFact(cachedFact);
                setIsLoading(false);
                return;
            }
            
            // Cache miss - fetch from API
            const fetchVinylFact = async () => {
                try {
                    console.log('Fetching vinyl fact from API');
                    const response = await fetch('/api/vinyl-fact');
                    const data = await response.json();

                    if (data.success) {
                        setVinylFact(data.fact);
                        vinylFactCache.set(data.fact); // Cache successful response
                    } else {
                        setVinylFact('Welcome to Good Neighbor Shop!');
                    }
                } catch (error) {
                    console.error('Failed to fetch vinyl fact:', error);
                    setVinylFact('Welcome to Good Neighbor Shop!');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchVinylFact();
        }
    }, []);

    return (
        <div className="welcome-hero">
            {/* <GrowingVines 
                vineCount={4} 
                animationDuration="6s"
                startDelay={1000}
            /> */}
            {/* <canvas style={{ background: 'red', width: '100%', height: '100%' }}></canvas> */}
            <div className='hero-image-container'>
                <WelcomeHeroText />
                <img src="/images/hifive-color.svg" alt="Good Neighbor Records" />
                <div
                    className='vinyl-fact-container'
                >
                    <div className='vinyl-fact-wrapper'>
                        {isLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4', color: '#333' }}>
                                    thinking... 🍃
                                </p>
                                {/* <img
                                    src="/images/juggle-color.svg"
                                    alt="Loading..."
                                    style={{
                                        flex: 1,
                                        width: '100px',
                                        height: '100px',
                                        animation: 'pulse 1.5s ease-in-out infinite'
                                    }}
                                /> */}
                                {/* <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4', color: '#333' }}>
                                    about music
                                </p> */}
                            </div>
                        ) : (
                            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4', color: '#333' }}>
                                🌱 {vinylFact}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            {/* <canvas style={{ background: 'red', width: '100%', height: '100%' }}></canvas> */}
        </div>
    );
}

function WelcomeHeroText() {
    return (
        <svg id="welcome-hero-text" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210.55 55.67">
            <text id="TEXT" className="cls-1 text-anim" style={{ "--char-index": 0 }} transform="translate(6.1 51.98) rotate(-39.05)"><tspan x="0" y="0" style={{ "--char-index": 0 }}>W</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 1 }} transform="translate(15.62 44.33) rotate(-36.27)"><tspan x="0" y="0">e</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 2 }} transform="translate(20.89 40.47) rotate(-34.72)"><tspan x="0" y="0">l</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 3 }} transform="translate(24.23 38.14) rotate(-33.13)"><tspan x="0" y="0">c</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 4 }} transform="translate(29.9 34.43) rotate(-31.04)"><tspan x="0" y="0">o</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 5 }} transform="translate(36.08 30.63) rotate(-28.12)"><tspan x="0" y="0">m</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 6 }} transform="translate(46.37 25.2) rotate(-25.17)"><tspan x="0" y="0">e</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 7 }} transform="translate(52.53 22.34) rotate(-23.63)"><tspan x="0" y="0"> </tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 8 }} transform="translate(54.71 21.37) rotate(-22.32)"><tspan x="0" y="0">t</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 9 }} transform="translate(59.24 19.48) rotate(-20.2)"><tspan x="0" y="0">o</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 10 }} transform="translate(66.1 17) rotate(-18.43)"><tspan x="0" y="0"> </tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 11 }} transform="translate(68.35 16.23) rotate(-16.99)"><tspan x="0" y="0">t</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 12 }} transform="translate(72.98 14.77) rotate(-14.53)"><tspan x="0" y="0">h</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 13 }} transform="translate(80.65 12.79) rotate(-11.56)"><tspan x="0" y="0">e</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 14 }} transform="translate(87.3 11.47) rotate(-9.63)"><tspan x="0" y="0"> </tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 15 }} transform="translate(89.62 11) rotate(-7.16)"><tspan x="0" y="0">G</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 16 }} transform="translate(98.66 9.89) rotate(-3.48)"><tspan x="0" y="0">o</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 17 }} transform="translate(106.08 9.44) rotate(-.05)"><tspan x="0" y="0">o</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 18 }} transform="translate(113.52 9.43) rotate(3.51)"><tspan x="0" y="0">d</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 19 }} transform="translate(121.04 9.94) rotate(5.86)"><tspan x="0" y="0"> </tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 20 }} transform="translate(123.39 10.1) rotate(8.67)"><tspan x="0" y="0">N</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 21 }} transform="translate(132.39 11.5) rotate(12.36)"><tspan x="0" y="0">e</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 22 }} transform="translate(139.05 12.99) rotate(14.94)"><tspan x="0" y="0">i</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 23 }} transform="translate(142.99 14.01) rotate(17.46)"><tspan x="0" y="0">g</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 24 }} transform="translate(149.41 16) rotate(20.75)"><tspan x="0" y="0">h</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 25 }} transform="translate(156.87 18.84) rotate(24.04)"><tspan x="0" y="0">b</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 26 }} transform="translate(163.56 21.83) rotate(27.12)"><tspan x="0" y="0">o</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 27 }} transform="translate(170.03 25.16) rotate(29.78)"><tspan x="0" y="0">r</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 28 }} transform="translate(175.31 28.21) rotate(31.4)"><tspan x="0" y="0"> </tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 29 }} transform="translate(177.38 29.42) rotate(33.21)"><tspan x="0" y="0">S</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 30 }} transform="translate(183.41 33.36) rotate(35.86)"><tspan x="0" y="0">h</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 31 }} transform="translate(189.84 38.02) rotate(38.35)"><tspan x="0" y="0">o</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 32 }} transform="translate(195.47 42.46) rotate(40.62)"><tspan x="0" y="0">p</tspan></text>
            <text className="cls-1 text-anim" style={{ "--char-index": 33 }} transform="translate(201.29 47.49) rotate(42.3)"><tspan x="0" y="0">!</tspan></text>
        </svg>
    );
}