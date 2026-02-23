import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const KIBANA_DASHBOARD_URL =
  'http://localhost:5601/app/dashboards#/view/d0f76154-c431-49e4-a4de-25345c4a1161' +
  '?embed=true' +
  '&_g=(refreshInterval%3A(pause%3A!t%2Cvalue%3A60000)%2Ctime%3A(from%3Anow-30m%2Cto%3Anow))' +
  '&show-time-filter=true' +
  '&hide-filter-bar=true';

@Component({
  selector: 'app-dashboard-analytics',
  templateUrl: './dashboard-analytics.component.html',
  styleUrl: './dashboard-analytics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardAnalyticsComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly kibanaUrl: SafeResourceUrl =
    this.sanitizer.bypassSecurityTrustResourceUrl(KIBANA_DASHBOARD_URL);
}
