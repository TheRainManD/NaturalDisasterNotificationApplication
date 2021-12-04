from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import tokenization
import tensorflow_hub as hub
import os
import re
import string
from transformers import DistilBertTokenizer, TFDistilBertModel
import requests

class BERT:
    def __init__(self):
        bert_layer = hub.KerasLayer("./bert_en_uncased_L-12_H-768_A-12_1", trainable=True)
        vocab_file = bert_layer.resolved_object.vocab_file.asset_path.numpy()
        do_lower_case = bert_layer.resolved_object.do_lower_case.numpy()
        # bert_layer = None
        self.tokenizer = tokenization.FullTokenizer(vocab_file, do_lower_case)
        self.saved_model = tf.keras.models.load_model('bert_multi_task.h5', custom_objects={"KerasLayer": hub.KerasLayer})  
    
    def data_preprocess(self, text_inputs):
        def remove_emoji(text_inputs):
            emoji = re.compile("["
                                u"\U0001F600-\U0001F64F"  
                                u"\U0001F300-\U0001F5FF"  
                                u"\U0001F680-\U0001F6FF"  
                                u"\U0001F1E0-\U0001F1FF"  
                                u"\U00002702-\U000027B0"
                                u"\U000024C2-\U0001F251"
                                "]+", flags = re.UNICODE)
            return emoji.sub(r'', text_inputs)
        
        def remove_punct(text_inputs):
            mapping = str.maketrans('', '', string.punctuation)
            return text_inputs.translate(mapping)
        
        def remove_links(text_inputs):
            text_inputs = ''.join([x for x in text_inputs if x in string.printable])
            text_inputs = re.sub(r'https?://\S+|www\.\S+', "", text_inputs)
            return text_inputs

        temp = "".join(text_inputs)
        temp = remove_emoji(temp)
        temp = remove_punct(temp)
        temp = remove_links(temp)
        text_inputs = [temp]

        return text_inputs

    def bert_encode(self, text_inputs, max_length = 128):
        tokens = []
        masks = []
        segments = []

        for text in text_inputs:
            text = self.tokenizer.tokenize(text)
            text = text[:max_length - 2]
            bert_input = ["[CLS]"] + text + ["[SEP]"]
            padding_length = max_length - len(bert_input)
            padding = [0] * padding_length

            token = self.tokenizer.convert_tokens_to_ids(bert_input)
            token += padding
            mask = [1] * len(bert_input) + padding
            segment = [0] * max_length

            tokens.append(token)
            masks.append(mask)
            segments.append(segment)

        return np.array(tokens), np.array(masks), np.array(segments)
    
    def predict(self, text):
        classes1 = [0, 1]
        classes2 = ['Blizzard', 'Earthquake', 'Fire', 'Flood', 'Hurricane', 'None', 'Storm', 'Tornado', 'Tsunami', 'Volcano']

        text = self.data_preprocess(text)
        bert_input = self.bert_encode(text)
        pre = self.saved_model.predict(bert_input)
  
        disaster_1_0_label = np.argmax(pre[0], axis = 1)
        category_label = np.argmax(pre[1], axis = 1)
        res = [classes1[disaster_1_0_label[0]], classes2[category_label[0]]]

        return res

class DistilBERT_NER:
    def __init__(self):
        self.tokenizer_ner = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
        self.saved_model_ner = tf.keras.models.load_model('distilbert_ner.h5', custom_objects={"TFDistilBertMainLayer": TFDistilBertModel})
    
    def ner_data_preprocess(self, text_inputs):
        def remove_emoji(text_inputs):
            emoji = re.compile("["
                                u"\U0001F600-\U0001F64F"  
                                u"\U0001F300-\U0001F5FF"  
                                u"\U0001F680-\U0001F6FF"  
                                u"\U0001F1E0-\U0001F1FF"  
                                u"\U00002702-\U000027B0"
                                u"\U000024C2-\U0001F251"
                                "]+", flags = re.UNICODE)
            return emoji.sub(r'', text_inputs)

        def remove_punct(text_inputs):
            mapping = str.maketrans('', '', string.punctuation)
            return text_inputs.translate(mapping)

        def remove_links(text_inputs):
            #text_inputs = ''.join([x for x in text_inputs if x in string.printable])
            text_inputs = re.sub(r'https?://\S+|www\.\S+', "", text_inputs)
            return text_inputs
        
        def remove_single_char(text_inputs):
            text_lst = re.findall( r'\w+|[^\s\w]+', text_inputs)
            for index in range(len(text_lst)):
                if len(text_lst[index]) == 1 and text_lst[index].isalpha():
                    text_lst[index] = ""
            text_inputs = ' '.join(text_lst)
            return text_inputs

        text_inputs = remove_emoji(text_inputs)
        text_inputs = remove_punct(text_inputs)
        text_inputs = remove_links(text_inputs)
        text_inputs = remove_single_char(text_inputs) 

        return text_inputs

    def ner_encode_inputs(self, text_str, max_length = 128):
        tokens = []
        masks = []
        segments = []

        text_str = text_str.lower()
        text_str = self.ner_data_preprocess(text_str)
        lst_words = re.findall( r'\w+|[^\s\w]+', text_str)

        text = []
        t_tag = []
        for index, word in enumerate(lst_words):
            text.extend(self.tokenizer_ner.tokenize(word))

        text = text[:max_length - 2]
        bert_input = ["[CLS]"] + text + ["[SEP]"]

        padding_length = max_length - len(bert_input)
        padding = [0] * padding_length

        token = self.tokenizer_ner.convert_tokens_to_ids(bert_input)
        token += padding
        mask = [1] * len(bert_input) + padding
        segment = [0] * max_length

        tokens.append(token)
        masks.append(mask)
        segments.append(segment)
        input_length = len(bert_input)

        return (np.array(tokens), np.array(masks)), input_length, bert_input
    
    def ner_predict(self, ner_input):
        locations = []
        tag_classes = ['B-art', 'B-eve', 'B-geo', 'B-gpe', 'B-nat', 'B-org', 'B-per','B-tim', 'I-art',
         'I-eve', 'I-geo', 'I-gpe', 'I-nat', 'I-org','I-per', 'I-tim', 'O']

        test_ner_input, input_length, input_token = self.ner_encode_inputs(ner_input)
        pre_ner = self.saved_model_ner.predict(test_ner_input)
        pre_ner = np.argmax(pre_ner, axis = 2)
        
        new_tokens = []
        for token in input_token:
            if token.startswith("##"):
                new_tokens[-1] = new_tokens[-1] + token[2:]
            else:
                new_tokens.append(token)
        ner_tokens = [tag_classes[i] for i in pre_ner[0][:len(new_tokens)]]

        for index in range(len(new_tokens)):
            if ner_tokens[index] == "B-geo":
                temp = [new_tokens[index]]
                while ner_tokens[index + 1] == "I-geo":
                    temp.append(new_tokens[index + 1])
                    index += 1
                locations.append(temp)

        return locations


app = Flask(__name__)

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
print("Loading model...")
bert_classification = BERT()
print("BERT Classification Model Loaded")
bert_ner = DistilBERT_NER()
print("BERT NER Model Loaded")


@app.route("/", methods = ["GET"])
def hello_world():
    print("test")
    return "Server is up"

@app.route("/", methods = ["POST"])
def classify():
    json_input = request.json 
    tweet_text = json_input['tweet']
    source = json_input['source']
    print("-------------------------------------------------------------")
    print("Tweet from ", source, ": ",tweet_text)
    #test_str = ["tornado threats from nicholas should remain low tonight across and inland of mid and upper texas coastal areas"]
    #test_str = "".join(test_str)

    tweet_text_list = [tweet_text]
    res1 = bert_classification.predict(tweet_text_list)
    res2 = bert_ner.ner_predict(tweet_text)
    locations = [" ".join(item) for item in res2]

    category = str(res1[1])
    is_disaster = res1[0]

    if(is_disaster):
        data = {"topic": category, "message": tweet_text, "locations": locations, "source": source}
        requests.post('https://wenhaotan-notification.herokuapp.com/notification',json=data)


    return jsonify({"disaster_or_not": is_disaster, "category": category, "locations": locations})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
    