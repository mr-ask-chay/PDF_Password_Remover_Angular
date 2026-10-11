import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { CommonModule } from '@angular/common';
import { AdsenseLoaderService } from './core/service/adsense-loader.service';

/** Per-route title/meta/canonical tags are handled by SeoTitleStrategy. */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
})
export class AppComponent {
  constructor(adsenseLoader: AdsenseLoaderService) {
    adsenseLoader.load();
  }
}
