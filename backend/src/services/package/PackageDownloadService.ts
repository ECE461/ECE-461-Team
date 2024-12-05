import * as vm from 'vm';

export class PackageDownloadService {
    static runJSProgramWithArgs(jsProgram: string, args: string[]): any {
        try {
            // Create a sandbox to execute the code in
            const sandbox = { result: null, process: { argv: args } };
    
            // Create a context for the sandbox
            vm.createContext(sandbox);
    
            // Run the program in the sandbox with simulated command-line arguments
            vm.runInContext(jsProgram, sandbox);
    
            // Return the result if there's any
            return sandbox.result;
        } catch (error) {
            console.error('Error executing JS program:', error);
            return null;
        }
    }
}