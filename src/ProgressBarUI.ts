import {InitProgressReport} from "@mlc-ai/web-llm";

export class ProgressBarUI {

    private parent: HTMLElement | undefined;
    private box: HTMLElement;
    private progressBar: HTMLElement;
    private progressInfo: HTMLElement;

    constructor(parent?: HTMLElement) {
        this.parent = parent;
        const {box, progressBarFill, progressInfo} = this.buildComponent();

        this.box = box;
        this.progressBar = progressBarFill;
        this.progressInfo = progressInfo;

        if (this.parent)
            this.parent.appendChild(this.box);
        else
            document.body.appendChild(this.box);
    }


    public showProgress(report: InitProgressReport): void {
        if(report.progress < 1 && this.box.style.display=='none'){
            this.box.style.display = 'block';
        }
        this.progressBar.style.width = `${report.progress * 100}%`;
        this.progressInfo.innerHTML = report.text;
    }

    public hide(): void {

        this.progressBar.style.width = '100%';

        // Hide after a short delay to show completion
        setTimeout(() => {
            if (this.box) {
                if (this.parent)
                    this.parent.removeChild(this.box);
                else
                    document.body.removeChild(this.box);
                this.box = null;
            }
        }, 400);
    }

    private buildComponent() {
        const box = document.createElement('div');

        box.style.display = 'none';
        const progressDiv = document.createElement('div');
        const progressInfo = document.createElement('p');
        progressInfo.id = "toto-progress-info";
        progressDiv.appendChild(progressInfo);

        const progressBarBg = document.createElement('div');
        progressBarBg.style.width = '100%';
        progressBarBg.style.height = '10px';
        progressBarBg.style.backgroundColor = '#ddd';
        progressBarBg.style.borderRadius = '5px';
        progressBarBg.style.marginTop = '6px';

        const progressBarFill = document.createElement('div');
        progressBarFill.id = "toto-progress-bar";
        progressBarFill.style.height = '100%';
        progressBarFill.style.width = '0%';
        progressBarFill.style.backgroundColor = '#4CAF50';
        progressBarFill.style.borderRadius = '5px';
        progressBarFill.style.transition = 'width 0.3s ease';

        progressBarBg.appendChild(progressBarFill);
        progressDiv.appendChild(progressBarBg);

        box.appendChild(progressDiv);

        return {
            box: box,
            progressInfo: progressInfo,
            progressBarFill: progressBarFill
        }

    }


}
