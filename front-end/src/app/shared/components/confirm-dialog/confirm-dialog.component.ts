import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
	title: string;
	message: string;
}

@Component({
	selector: 'app-confirm-dialog',
	imports: [MatDialogModule, MatButtonModule, MatIconModule],
	template: `
		<div class="dialog-header">
			<h2 id="dialog-title" mat-dialog-title>{{ data.title }}</h2>
			<button mat-icon-button type="button" class="close-button" (click)="onCancel()" aria-label="Fechar">
				<mat-icon>close</mat-icon>
			</button>
		</div>

		<mat-dialog-content class="dialog-content" aria-describedby="dialog-message">
			<p id="dialog-message" class="dialog-message">{{ data.message }}</p>
			<div class="alert-box" role="status" aria-live="polite">
				<mat-icon>warning</mat-icon>
				<span>Essa ação é definitiva e pode afetar reservas vinculadas.</span>
			</div>
		</mat-dialog-content>

		<mat-dialog-actions align="end" class="dialog-actions">
			<button mat-stroked-button type="button" class="cancel-btn" (click)="onCancel()">Cancelar</button>
			<button mat-flat-button type="button" class="delete-btn" (click)="onConfirm()">Excluir</button>
		</mat-dialog-actions>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	styles: [`
		:host {
			display: block;
		}

		.dialog-header {
			padding: 22px 24px 0;
			display: flex;
			align-items: center;
			justify-content: space-between;
			border-bottom: 1px solid var(--border);
		}

		.close-button {
			color: var(--text-muted);
		}

		.dialog-content {
			padding: 24px !important;
			min-width: 440px;
		}

		.dialog-message {
			margin: 0 0 16px;
			color: var(--text-primary);
			font-size: 14px;
			line-height: 1.6;
		}

		.alert-box {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 12px 14px;
			border-radius: 12px;
			background: rgba(217, 92, 84, 0.12);
			border: 1px solid rgba(217, 92, 84, 0.25);
			color: #b6473f;
			font-size: 12px;
			font-weight: 600;
		}

		.alert-box mat-icon {
			font-size: 18px;
			width: 18px;
			height: 18px;
		}

		.dialog-actions {
			padding: 16px 24px 22px !important;
			border-top: 1px solid var(--border);
			justify-content: flex-end;
			gap: 12px;
		}

		.cancel-btn {
			border-radius: 12px !important;
			font-size: 14px;
			font-weight: 600;
			color: var(--text-muted) !important;
			border-color: var(--border) !important;
			min-width: 120px;
			text-transform: none !important;
		}

		.delete-btn {
			border-radius: 12px !important;
			font-size: 14px;
			font-weight: 700;
			min-width: 140px;
			text-transform: none !important;
			background: #d95c54 !important;
			color: #ffffff !important;
			box-shadow: 0 6px 14px rgba(217, 92, 84, 0.25);
		}

		.delete-btn:hover:not(:disabled) {
			background: #c44a43 !important;
			transform: translateY(-1px);
		}

		::ng-deep {
			.mat-mdc-dialog-container {
				border-radius: 16px;
				background: var(--surface-strong);
				box-shadow: 0 24px 48px rgba(35, 31, 27, 0.2);
				border: 1px solid var(--border);
				padding: 0 !important;
				overflow: hidden !important;
				max-width: 92vw;
			}

			h2.mat-mdc-dialog-title {
				color: var(--text-primary);
				font-size: 20px;
				font-weight: 700;
				margin: 0;
				padding: 0 0 18px 0;
			}
		}

		@media (max-width: 600px) {
			.dialog-content {
				min-width: 300px;
				padding: 20px !important;
			}

			.dialog-header {
				padding: 18px 20px 0;
			}

			.dialog-actions {
				padding: 14px 20px 18px !important;
				flex-direction: column;
			}

			.cancel-btn,
			.delete-btn {
				width: 100%;
			}
		}
	`]
})
export class ConfirmDialogComponent {
	readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
	readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

	onCancel(): void {
		this.dialogRef.close(false);
	}

	onConfirm(): void {
		this.dialogRef.close(true);
	}
}
