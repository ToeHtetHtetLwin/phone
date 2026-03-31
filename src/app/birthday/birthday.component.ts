import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { gsap } from 'gsap';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
} from 'postprocessing';

@Component({
  selector: 'app-birthday',
  templateUrl: './birthday.component.html',
  styleUrls: ['./birthday.component.css'],
  standalone: true,
  imports: [HttpClientModule, CommonModule],
})
export class BirthdayComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  // Reference for the scrolling text area
  @ViewChild('scrollFrame') private scrollFrame!: ElementRef;

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  public currentUser: any = null;
  public messages: any[] = [];
  public isStarted = false;

  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private animationId!: number;
  private audio = new Audio();

  ngOnInit() {
    this.fetchCustomerData();
  }

  private fetchCustomerData() {
    this.http.get<any[]>('/customers.json').subscribe({
      next: (data) => {
        const urlId = Number(this.route.snapshot.queryParams['id']) || 1;
        this.currentUser = data.find((u) => u.id === urlId) || data[0];

        this.messages = this.currentUser.messages.map((m: any) => ({
          ...m,
          displayedText: '',
        }));

        setTimeout(() => this.initScene(), 50);
      },
      error: (err) => console.error('Data loading failed', err),
    });
  }

  public startMagic() {
    this.isStarted = true;

    if (this.currentUser && this.currentUser.music) {
      this.audio.src = this.currentUser.music;
      this.audio.loop = true;
      this.audio.play().catch((e) => console.error('Audio error:', e));
    }

    this.startTypingEffect();
  }

  private startTypingEffect() {
    let cumulativeDelay = 800;

    this.messages.forEach((msg) => {
      setTimeout(() => {
        let charIndex = 0;
        const typing = setInterval(() => {
          if (charIndex < msg.text.length) {
            msg.displayedText += msg.text[charIndex];
            charIndex++;
            // Scroll down as each character is typed
            this.scrollToBottom();
          } else {
            clearInterval(typing);
          }
        }, 45);
      }, cumulativeDelay);

      // Calculate delay: typing time + pause before next bubble
      cumulativeDelay += msg.text.length * 45 + 1500;
    });
  }

  private scrollToBottom(): void {
    try {
      const el = document.querySelector('.text-overlay');
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {}
  }

  private initScene() {
    if (!this.canvasContainer) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    this.composer.addPass(
      new EffectPass(camera, new BloomEffect({ intensity: 1.5 })),
    );

    const pts = [];
    for (let i = 0; i < 4000; i++) {
      const t = Math.random() * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      pts.push(new THREE.Vector3(x * 2.5, y * 2.5, (Math.random() - 0.5) * 15));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.PointsMaterial({
      color: this.currentUser.heartColor || '#ff1e56',
      size: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    const heart = new THREE.Points(geometry, material);
    scene.add(heart);

    camera.position.z = 100;
    gsap.to(camera.position, { z: 65, duration: 4, ease: 'power2.out' });

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      heart.rotation.y += 0.003;
      this.composer.render();
    };
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.audio.pause();
    this.audio.src = '';
  }
}
