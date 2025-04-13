import {InitProgressReport} from "@mlc-ai/web-llm";

export class ProgressBarUI {
    private progressBarContainer: HTMLElement | null = null;

    public showProgress(report: InitProgressReport): void {
        // Create progress bar container if it doesn't exist
        if (report.progress < 1 && !this.progressBarContainer ) {
           this.progressBarContainer = this.buildContainer();
           document.body.appendChild(this.progressBarContainer);
        }

        if(!this.progressBarContainer)
            return;

        // Update progress bar width
        const progressBar = this.progressBarContainer.querySelector('.toto-progress-bar');
        const messageElement = this.progressBarContainer.querySelector('.toto-progress-message');
        if (progressBar && messageElement) {
            progressBar.style.width = `${report.progress * 100}%`;
            messageElement.innerHTML='Toto AI Translator: '+report.text.substring(0,100);
        }
    }

    public hide(): void {
        if (this.progressBarContainer) {
            // Optional: animate the progress bar to 100% before hiding
            const progressBar = this.progressBarContainer.querySelector('.toto-progress-bar');
            if (progressBar) {
                progressBar.style.width = '100%';
            }

            // Hide after a short delay to show completion
            setTimeout(() => {
                if (this.progressBarContainer) {
                    document.body.removeChild(this.progressBarContainer);
                    this.progressBarContainer = null;
                }
            }, 500);
        }
    }

    private buildContainer(): HTMLElement {
        let container = document.createElement('div');
        container.className = 'toto-progress-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = 'auto';
        container.style.zIndex = '10000';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'toto-progress-bar';
        progressBar.style.height = '14px';
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = '#3b82f6';
        progressBar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'; // Subtle shadow
        progressBar.style.transition = 'width 0.3s ease-in-out';

        // Create message element with white background
        const messageElement = document.createElement('div');
        messageElement.className = 'toto-progress-message';
        messageElement.textContent = 'Loading/downloading ML model. First time this requires a long time...';
        messageElement.style.fontSize = '12px';
        messageElement.style.color = '#1a3b5d';
        messageElement.style.textAlign = 'center';
        messageElement.style.padding = '6px 0';
        messageElement.style.backgroundColor = '#f0f4f8';
        messageElement.style.width = '100%';
        messageElement.style.borderBottom = '1px solid #cbd5e0';

        // Append elements to container
        container.appendChild(messageElement);
        container.appendChild(progressBar);
        return container;
    }
}
