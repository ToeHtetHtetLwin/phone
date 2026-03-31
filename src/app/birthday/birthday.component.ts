import { Component, ElementRef, ViewChild, AfterViewInit, inject, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from 'postprocessing';

@Component({
  selector: 'app-birthday',
  templateUrl: './birthday.component.html',
  styleUrls: ['./birthday.component.css'],
  standalone: true,
  imports: [HttpClientModule, CommonModule]
})
export class BirthdayComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  // Dynamic Data Holders
  public currentUser: any = null;
  public messages: any[] = [];
  
  // Three.js Reference for cleanup
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private animationId!: number;

  ngOnInit() {
    this.fetchCustomerData();
  }

  private fetchCustomerData() {
    // Make sure the path matches where you put the file (e.g., src/assets/customers.json)
    this.http.get<any[]>('/customers.json').subscribe({
      next: (data) => {
        // 1. Get 'id' from URL ?id=2. Default to 1 if not provided.
        const urlId = Number(this.route.snapshot.queryParams['id']) || 1;
        
        // 2. Find the specific user
        this.currentUser = data.find(u => u.id === urlId) || data[0];

        // 3. Setup messages for typing
        this.messages = this.currentUser.messages.map((m: any) => ({
          ...m,
          displayedText: ""
        }));

        // 4. Start visuals after a tiny timeout to ensure DOM is ready (@if in HTML)
        setTimeout(() => {
          this.initScene();
          this.startTypingEffect();
        }, 50);
      },
      error: (err) => {
        console.error("Could not load customers.json. Check the file path!", err);
      }
    });
  }

  private startTypingEffect() {
    let cumulativeDelay = 1500; 
    this.messages.forEach((msg) => {
      setTimeout(() => {
        let charIndex = 0;
        const typing = setInterval(() => {
          if (charIndex < msg.text.length) {
            msg.displayedText += msg.text[charIndex];
            charIndex++;
          } else {
            clearInterval(typing);
          }
        }, 50);
      }, cumulativeDelay);
      // Wait for previous message to finish + a small pause
      cumulativeDelay += (msg.text.length * 50) + 1200;
    });
  }

  private initScene() {
    if (!this.canvasContainer) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.renderer = new THREE.WebGLRenderer({ 
      powerPreference: "high-performance", 
      antialias: false, 
      alpha: true 
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);

    // Post-processing (Bloom)
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    const bloomEffect = new BloomEffect({ 
      intensity: 2.8, 
      luminanceThreshold: 0.1, 
      height: 480 
    });
    this.composer.addPass(new EffectPass(camera, bloomEffect));

    // Create Heart Particles
    const pts = [];
    for (let i = 0; i < 7000; i++) {
      const t = Math.random() * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      pts.push(new THREE.Vector3(x * 2.5, y * 2.5, (Math.random() - 0.5) * 15));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.PointsMaterial({ 
      color: new THREE.Color(this.currentUser.heartColor), // DYNAMIC COLOR
      size: 0.18 
    });

    const heart = new THREE.Points(geometry, material);
    scene.add(heart);

    // Floating Background Particles
    const bgGeometry = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(500 * 3);
    for (let i = 0; i < 1500; i++) bgPositions[i] = (Math.random() - 0.5) * 150;
    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    const bgMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.3 });
    const bgParticles = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(bgParticles);

    // Camera & Heart Animations
    camera.position.z = 130;
    gsap.to(camera.position, { z: 65, duration: 4, ease: "power3.out" });
    gsap.to(heart.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.8, repeat: -1, yoyo: true, ease: "sine.inOut" });

    const clock = new THREE.Clock();
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      heart.rotation.y += 0.004;
      bgParticles.position.y += 0.02;
      if (bgParticles.position.y > 70) bgParticles.position.y = -70;
      this.composer.render(delta);
    };
    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) this.renderer.dispose();
  }
}