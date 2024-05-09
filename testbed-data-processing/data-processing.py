import pandas as pd  # https://www.youtube.com/watch?v=E5ONTXHS2mM
import matplotlib.pyplot as plt

red_minus = 20
yellow_minus = 40
green = 60
yellow_plus = 80
red_plus = 100
alpha = 1
beta = 2

# .csv column names
col_index = "Index"
col_buffer = " Buffer Level"
col_bitrate = " Bitrate"
col_playback = " Playback Timestamp"
col_qoe = " QoE"
col_bandwidth = " Bandwidth"
col_latency = " Latency"
col_resolution = " Resolution"


def get_hob(df):
    hob = []
    prev = 0
    for x in df[col_buffer]:
        if 0 <= x and x < red_minus:
            prev -= beta
        elif x < yellow_minus:
            prev -= alpha
        elif x < green:
            prev += 1
        elif x < yellow_plus:
            prev -= alpha
        elif x < red_plus:
            prev -= beta

        hob.append(prev)

    return hob


def plot_graph(
    csv_file1,
    csv_file2,
    csv_file3,
    file1_label,
    file2_label,
    file3_label,
    x_col,
    y_col,
    x_label="",
    y_label="",
):
    if x_label == "":
        x_label = x_col
    if y_label == "":
        y_label = y_col

    # Read the CSV files into pandas DataFrames
    df1 = pd.read_csv(csv_file1)
    df2 = pd.read_csv(csv_file2)
    df3 = pd.read_csv(csv_file3)

    print(df1)
    print("Columns in File 1:", df1.columns)
    print("Columns in File 2:", df2.columns)
    print("Columns in File 3:", df3.columns)

    y_data_1 = []
    y_data_2 = []
    y_data_3 = []
    if y_col == "HoB":
        y_data_1 = get_hob(df1)
        y_data_2 = get_hob(df2)
        y_data_3 = get_hob(df3)
    else:
        y_data_1 = df1[y_col]
        y_data_2 = df2[y_col]
        y_data_3 = df3[y_col]

    plt.figure(figsize=(10, 6))
    # Plotting
    plt.plot(df1[x_col], y_data_1, label=file1_label)
    plt.plot(df2[x_col], y_data_2, label=file2_label)
    plt.plot(df3[x_col], y_data_3, label=file3_label)

    # ax2 = ax1.twinx()
    # ax2.plot(df1[col_playback], df1[col_bandwidth], label="Profile 1")

    # print(get_hob(df1))
    # print(get_hob(df2))
    # print(get_hob(df3))

    # Add labels and title
    plt.xlabel(x_label)
    plt.ylabel(y_label)

    # Add legend
    plt.legend()

    # Show plot
    plt.grid(True)
    plt.show()


# Example usage:
file1 = "./raw-data/dashjs_data_BBARule_default-descProfile_1_.csv"
file2 = "./raw-data/dashjs_data_HoBRule_default-descProfile_1_.csv"
file3 = "./raw-data/dashjs_data_ThroughputPrediction_default-descProfile_1_.csv"
plot_graph(
    file1,
    file2,
    file3,
    "BBARule",
    "HoBRule",
    "ThroughputPrediction",
    col_playback,
    "HoB",
)
