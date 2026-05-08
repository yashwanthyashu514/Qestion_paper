export const exportToWord = (elementSelector, filename = 'document.doc') => {
    const element = document.querySelector(elementSelector);
    if (!element) {
        console.error('Element not found');
        return;
    }

    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <meta charset='utf-8'>
        <title>Export HTML To Doc</title>
        <style>
            body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 11pt; color: #000; }
            .text-center, [style*="text-align: center"] { text-align: center; }
            .font-bold, [style*="font-weight: 700"] { font-weight: bold; }
            .uppercase, [style*="text-transform: uppercase"] { text-transform: uppercase; }
            img { max-width: 100%; display: block; margin: 0 auto; text-align: center; }
            .border-b-2, [style*="border-bottom"] { border-bottom: 2px solid #000; }
            .pb-4, [style*="padding-bottom"] { padding-bottom: 16px; }
            h1 { font-size: 16pt; margin-top: 10px; margin-bottom: 5px; }
            p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; }
        </style>
    </head>
    <body>`;
    
    const postHtml = "</body></html>";
    const html = preHtml + element.innerHTML + postHtml;

    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });
    
    // Create download link element
    const downloadLink = document.createElement("a");

    document.body.appendChild(downloadLink);
    
    if (navigator.msSaveOrOpenBlob) {
        navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        // Create a link to the file
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        
        // Setting the file name
        downloadLink.download = filename;
        
        //triggering the function
        downloadLink.click();
    }
    
    document.body.removeChild(downloadLink);
};
