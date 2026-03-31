import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from 'postprocessing';

@Component({
  selector: 'app-birthday',
  templateUrl: './birthday.component.html',
  styleUrls: ['./birthday.component.css'],
  standalone: true
})
export class BirthdayComponent implements AfterViewInit {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  messages = [
    { text: "To my favorite person in the world... 🌎❤️", side: 'left', displayedText: "" },
    { text: "You're the glow in my darkest days. ✨", side: 'right', displayedText: "" },
    { text: "Every moment with you is a gift. 🎁", side: 'left', displayedText: "" },
    { text: "Happy Birthday, My Soulmate! 🎂💖", side: 'right', displayedText: "" }
  ];

  ngAfterViewInit() {
    this.initScene();
    this.startTypingEffect();
  }

  private startTypingEffect() {
    let cumulativeDelay = 3000; 
    this.messages.forEach((msg) => {
      setTimeout(() => {
        let charIndex = 0;
        const typing = setInterval(() => {
          msg.displayedText += msg.text[charIndex];
          charIndex++;
          if (charIndex === msg.text.length) clearInterval(typing);
        }, 50);
      }, cumulativeDelay);
      cumulativeDelay += (msg.text.length * 50) + 1200;
    });
  }

  private initScene() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ powerPreference: "high-performance", antialias: false, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.canvasContainer.nativeElement.appendChild(renderer.domElement);

    // 1. Bloom/Glow Effect
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomEffect = new BloomEffect({ intensity: 2.8, luminanceThreshold: 0.1, height: 480 });
    composer.addPass(new EffectPass(camera, bloomEffect));

    // 2. BIG Heart Particles (ဖုန်းထက် ပိုကြီးအောင် ညှိထားသည်)
    const pts = [];
    for (let i = 0; i < 7000; i++) {
      const t = Math.random() * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      // Scale Factor ကို 2.5 အထိ မြှင့်ထားလို့ အသည်းပုံ အကြီးကြီးဖြစ်သွားပါမယ်
      pts.push(new THREE.Vector3(x * 2.5, y * 2.5, (Math.random() - 0.5) * 15));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.PointsMaterial({ color: 0xff1e56, size: 0.18 });
    const heart = new THREE.Points(geometry, material);
    scene.add(heart);

    // 3. Floating Background Particles
    const bgGeometry = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(500 * 3);
    for (let i = 0; i < 1500; i++) bgPositions[i] = (Math.random() - 0.5) * 150;
    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    const bgMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.3 });
    const bgParticles = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(bgParticles);

    // Camera Zoom Animation (အသည်းပုံ အကုန်မြင်ရအောင် z: 65 ထားသည်)
    camera.position.z = 130;
    gsap.to(camera.position, { z: 65, duration: 4, ease: "power3.out" });

    // Heart "Pulse" Animation
    gsap.to(heart.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.8, repeat: -1, yoyo: true, ease: "sine.inOut" });

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      heart.rotation.y += 0.004;
      bgParticles.position.y += 0.02;
      if (bgParticles.position.y > 70) bgParticles.position.y = -70;
      composer.render(delta);
    };
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    });
  }
}