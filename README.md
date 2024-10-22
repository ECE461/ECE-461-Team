# ECE-461-Team
Package Manager Repository - ECE 461 Team 4

Our system is built to help you manage different packages and choose the best ones for you.

 # ./run install
This command will install any dependencies for you.

Dependencies:
Commander   - CLI interface
URL         - Parseing URL's
axios       - API calls
Jest        - for testing

# ./run URL_FILE
URL_FILE is either a NPM or GitHub repository link. 
This command will return a net score from 0-1 for the package as well as individual metric scores for busfactor, license, maintainer, correctness, and ramp up.
Our net score calculation is NetScore = ((0.30)*BusFactor + (0.20)*Correctness + (0.20)*RampUp + (0.30)*Responsive)) * License.
This command will also return latency scores for each of these metrics.

# ./run test
This command will run our test suite located in the Metric Tests folder. Our test suite contains tests for each of our metrics as well as our Metric Manager class and CLIParser file.

# automatic deployment to AWS
