import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const KIBANA_DASHBOARD_URL =
  'http://localhost:5601/app/dashboards#/view/423022dc-9859-4509-b03b-06df722478f4' +
  '?embed=true' +
  '&_g=(refreshInterval:(pause:!t,value:60000),time:(from:now-15m,to:now))' +
  '&_a=()' +
  '&show-time-filter=true';

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
