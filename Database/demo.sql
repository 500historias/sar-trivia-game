  -- questions
  -- id, text, op1, op2, op3, op4, diff

  -- quest_users
  -- q_id, u_id, timestamp, result

  -- OPCION: tener una tabla user:
  -- userid, level 

  -- PARAMS RECIBIDO
  -- $user // Rashid: 0001



select * from user u 
where u.id = 0001  -- 0001 Rashid
-- $level = 3

-- IF vacio
insert into user values(0001, 1)
-- $level = 1

-- OBTENER PREGUNTA
select * from questions q
where q.id not in
    (select qu.q_id from quest_users qu 
      where qu.u_id = 0001
        and qu.q_result = TRUE)  -- Esto retorna preguntas que se hayan contestado bien
  and q.diff = 1  -- or 2, or 3
order by random()
limit 1

-- Opcion 2 (repetir preguntas no exitosas)
select * from questions q
where q.id not in
    (select qu.q_id from quest_users qu 
      where qu.u_id = 0001
        and qu.q_result = TRUE)  -- Esto retorna preguntas que se hayan contestado bien
  and diff = 1 -- or 2, or 3
  order by random()
  limit 30

-- SI hay menos de X preguntas disponibles en el nivel, o el query es vacio: 
-- + mando la pregunta 
-- + incremento el nivel 

update user u 
   set u.level = u.level+1











