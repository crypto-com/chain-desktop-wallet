console.log("postinstall");
const os = require('os');
const { exec } = require("child_process");

console.log("os=", os.type());
if ("Linux"===os.type()) {
    console.log("run fix")
    exec("./fix.sh", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`${stdout}`);
    });
}