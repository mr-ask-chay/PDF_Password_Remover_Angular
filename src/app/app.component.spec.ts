import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';

describe('AppComponent', () => {

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render header, router outlet and footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-header')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
    expect(el.querySelector('app-footer')).toBeTruthy();
  });

});
