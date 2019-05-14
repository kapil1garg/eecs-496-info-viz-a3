# Interactive Wine Visualizer | Kapil Garg
Wine visualizer for Northwestern's EECS 496: Interactive Information Visualization class.
See a live demo [here](https://eecs496-interactive-wine-viz.herokuapp.com/).

# Setup
## Data Analysis
1. Make sure you have Python 3.7 and [pipenv](https://docs.pipenv.org/en/latest/) installed.
2. Download the data from [Kaggle](https://www.kaggle.com/zynicide/wine-reviews#winemag-data-130k-v2.csv) and add it to the `data/` directory. 
3. Run `pipenv install` to install the necessary packages and create a virtual env. Once completed, run `pipenv shell` to start the env.
4. Run `jupyter notebook` to start a Jupyter Notebook server. Navigate to `eda/WineInteractiveViz_EDA` to see and run analysis code.

## Webapp
1. Make sure you have Node.js installed. Run `npm install` to install packages.
2. Once packages have installed, run `npm start` to see the application locally.
  