import sys
import cv2

from os import walk
from os import path

from mtcnn.mtcnn import MTCNN
from PIL import Image
from numpy import asarray

from keras_vggface.utils import preprocess_input
from keras_vggface.vggface import VGGFace
from scipy.spatial.distance import cosine

required_size=(224, 224)

print('Loading MTCNN started');
detector = MTCNN()
print('MTCNN created')



imageIn = sys.argv[1]
imageOut = sys.argv[2]

print('read '+imageIn)
img = cv2.imread(imageIn)
blur = img.copy()



faces = detector.detect_faces(img)
print('{0} faces detected'.format(len(faces)))
for face in faces:
    #x1, y1, width, height = face['box']
    pos = face['box']
    #blur[pos[1]:pos[1]+pos[3], pos[0]:pos[0]+pos[2]] = cv2.blur(blur[pos[1]:pos[1]+pos[3], pos[0]:pos[0]+pos[2]], (80,80))
    blur = cv2.rectangle(blur,(pos[0],pos[1]),(pos[0]+pos[2], pos[1]+pos[3]), (0,0,0),-1)

print('write '+imageOut)
cv2.imwrite(imageOut, blur)

   



