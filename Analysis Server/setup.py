import gdown
import tarfile

def downloadFile(link, filename):
    id = link.split("/")[5]
    url = "https://drive.google.com/uc?id=" + id + "&export=download"
    gdown.download(url, filename, quiet=False)

if __name__ == '__main__':
    downloadFile("https://drive.google.com/file/d/14g7cr8IbfMgXOQNxOC5hMESbqtrLevHb/view?usp=sharing", "distilbert_ner.h5")
    downloadFile("https://drive.google.com/file/d/12AOW_ydR5ei_avYt62tvS7GzhHps10QJ/view?usp=sharing", "bert_multi_task.h5")
    downloadFile("https://drive.google.com/file/d/1ZAoYv7BBA5V5d-2p9Fpv63L8Lj0xSymK/view?usp=sharing", "bert_en_uncased_L-12_H-768_A-12_1.tar.gz")
    
    print("Starting file extracting")
    file = tarfile.open("bert_en_uncased_L-12_H-768_A-12_1.tar.gz")
    file.extractall("./bert_en_uncased_L-12_H-768_A-12_1")
    file.close()
    print("Finished file extracting")
