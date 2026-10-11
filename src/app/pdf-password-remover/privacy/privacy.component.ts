import {
  Component,
  AfterViewInit,
  ElementRef,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './privacy.component.html',
})
export class PrivacyComponent implements AfterViewInit, OnDestroy {
  readonly year = new Date().getFullYear();
  /** Update when the policy text changes (not on every build). */
  readonly lastUpdated = '2026-10-11';

  private io?: IntersectionObserver;
  private scrollRevealBound?: () => void;

  constructor(
    private readonly elRef: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const root = this.elRef.nativeElement;

    const nodeList = root.querySelectorAll('.fade-in');
    const els: HTMLElement[] = Array.from(nodeList).filter(
      (n): n is HTMLElement => n instanceof HTMLElement
    );

    const revealIfVisible = (el: HTMLElement) => {
      if (!el || !(el instanceof HTMLElement)) return;
      if (el.classList.contains('show')) return;

      if (typeof el.getBoundingClientRect !== 'function') return;

      const r = el.getBoundingClientRect();
      const inView = r.top < window.innerHeight * 0.95 && r.bottom > 0;
      if (inView) el.classList.add('show');
    };

    for (const e of els) revealIfVisible(e);

    if (typeof (globalThis as any).IntersectionObserver === 'function') {
      this.io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (en.isIntersecting) {
              const tgt = en.target as HTMLElement;
              tgt.classList.add('show');
              this.io?.unobserve(tgt);
            }
          }
        },
        { threshold: 0, root: null, rootMargin: '0px 0px -10% 0px' }
      );

      for (const e of els) this.io.observe(e);
    } else {
      const onScroll = () => {
        for (const e of els) revealIfVisible(e);
      };
      this.scrollRevealBound = onScroll;
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
    }

    setTimeout(() => {
      for (const e of els) revealIfVisible(e);
    }, 0);
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    if (this.scrollRevealBound) {
      window.removeEventListener('scroll', this.scrollRevealBound);
      window.removeEventListener('resize', this.scrollRevealBound);
    }
  }
}
