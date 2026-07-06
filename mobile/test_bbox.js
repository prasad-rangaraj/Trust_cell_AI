import fs from 'fs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

// Since we're in node, we can't use GLTFLoader directly easily without DOM/blob mock.
// We can just print a message instead.
